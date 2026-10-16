import { useState, useCallback, useEffect } from "react";
import { DEFAULT_CARDS, type Card, type Extension } from "@/data/cards";
import { personalizeCard, type Gender, type Likes } from "@/lib/targeting";

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Everything the setup page decides before a game starts */
export interface GameConfig {
  players: string[];
  genders: (Gender | null)[];
  /** Who each player is into, for flirty matching */
  likes: Likes[];
  enabledExtensions: Extension[];
  customCards: Card[];
  cardsPerTurn: number;
  /** null means the game goes on until the players stop it */
  maxRounds: number | null;
  /** Flirty cards that name someone follow who-likes-who */
  genderMatch: boolean;
}

export interface TurnRecord {
  round: number;
  player: number;
  /** The card played, or null when the player took the sips instead */
  card: Card | null;
}

export interface GameState extends GameConfig {
  /** Every finished turn, oldest first */
  history: TurnRecord[];
  phase: "setup" | "playing" | "finished";
  currentPlayerIndex: number;
  deck: Card[];
  currentCards: Card[];
  usedCount: number;
  round: number;
  /** Sips each player took by skipping their cards, indexed like players */
  sips: number[];
  /** How often each player has been named by a played card */
  targetCounts: number[];
}

export const SKIP_SIPS = 15;

const INITIAL_STATE: GameState = {
  phase: "setup",
  players: [],
  genders: [],
  likes: [],
  currentPlayerIndex: 0,
  deck: [],
  currentCards: [],
  usedCount: 0,
  round: 1,
  enabledExtensions: ["ORIGINAL"],
  customCards: [],
  cardsPerTurn: 3,
  maxRounds: null,
  genderMatch: false,
  sips: [],
  targetCounts: [],
  history: [],
};

// Turns that can be undone; kept in memory only, so undo is for slips of the
// finger, not for going back after the app restarts
const UNDO_DEPTH = 20;

// A game in progress survives the app being backgrounded or killed
const STORAGE_KEY = "thirst-game-state-v1";

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    if (!["setup", "playing", "finished"].includes(saved.phase)) return null;
    if (!Array.isArray(saved.players) || !Array.isArray(saved.deck) || !Array.isArray(saved.currentCards)) return null;
    return { ...INITIAL_STATE, ...saved };
  } catch {
    return null;
  }
}

function buildDeck(config: Pick<GameConfig, "customCards" | "enabledExtensions">): Card[] {
  return shuffle(
    [...DEFAULT_CARDS, ...config.customCards].filter((c) =>
      config.enabledExtensions.includes(c.extension as Extension)
    )
  );
}

/** Deal a hand for `playerIndex`, naming players on some of the cards */
function deal(cards: Card[], state: Pick<GameState, "players" | "genders" | "likes" | "targetCounts" | "genderMatch">, playerIndex: number): Card[] {
  return cards.map((card) =>
    personalizeCard(card, {
      players: state.players,
      genders: state.genders,
      likes: state.likes ?? [],
      targetCounts: state.targetCounts,
      currentPlayerIndex: playerIndex,
      genderMatch: state.genderMatch,
    })
  );
}

function freshGame(config: GameConfig): GameState {
  const shuffled = buildDeck(config);
  const base: GameState = {
    ...INITIAL_STATE,
    ...config,
    phase: "playing",
    sips: config.players.map(() => 0),
    targetCounts: config.players.map(() => 0),
    history: [],
  };
  return {
    ...base,
    currentCards: deal(shuffled.slice(0, config.cardsPerTurn), base, 0),
    deck: shuffled.slice(config.cardsPerTurn),
  };
}

/** The state after the current player picks card `pickedIndex`, or skips (null) */
function nextTurn(prev: GameState, pickedIndex: number | null): GameState {
  const { cardsPerTurn } = prev;
  const skipped = pickedIndex === null;
  const sips = prev.players.map((_, i) =>
    (prev.sips[i] ?? 0) + (skipped && i === prev.currentPlayerIndex ? SKIP_SIPS : 0)
  );
  const picked = skipped ? null : prev.currentCards[pickedIndex] ?? null;
  const targetCounts = prev.players.map((_, i) =>
    (prev.targetCounts[i] ?? 0) + (picked?.targets?.includes(i) ? 1 : 0)
  );
  const history = [...prev.history, { round: prev.round, player: prev.currentPlayerIndex, card: picked }];
  const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
  const newRound = nextPlayerIndex === 0 ? prev.round + 1 : prev.round;

  if (prev.maxRounds !== null && newRound > prev.maxRounds) {
    return { ...prev, sips, targetCounts, history, phase: "finished" };
  }

  const reshuffle = prev.deck.length < cardsPerTurn;
  const source = reshuffle ? buildDeck(prev) : prev.deck;
  const next = { ...prev, sips, targetCounts, history };
  return {
    ...next,
    currentPlayerIndex: nextPlayerIndex,
    currentCards: deal(source.slice(0, cardsPerTurn), next, nextPlayerIndex),
    deck: source.slice(cardsPerTurn),
    usedCount: reshuffle ? 0 : prev.usedCount + cardsPerTurn,
    round: newRound,
  };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadSavedState() ?? INITIAL_STATE);
  const [undoStack, setUndoStack] = useState<GameState[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable: the game just won't survive a restart
    }
  }, [state]);

  const startGame = useCallback((config: GameConfig) => {
    setUndoStack([]);
    setState(freshGame(config));
  }, []);

  /** Same players and settings, brand new game */
  const playAgain = useCallback(() => {
    setUndoStack([]);
    setState((prev) => freshGame(prev));
  }, []);

  const advance = useCallback((pickedIndex: number | null) => {
    setUndoStack((stack) => [...stack, state].slice(-UNDO_DEPTH));
    setState(nextTurn(state, pickedIndex));
  }, [state]);

  const pickCard = useCallback((cardIndex: number) => advance(cardIndex), [advance]);
  const skipCards = useCallback(() => advance(null), [advance]);

  /** Back to the start of the previous turn, with the same cards on the table */
  const undo = useCallback(() => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setUndoStack(undoStack.slice(0, -1));
    setState(previous);
  }, [undoStack]);

  const resetGame = useCallback(() => {
    setUndoStack([]);
    // Keep players and settings so the next setup screen is prefilled
    setState((prev) => ({
      ...INITIAL_STATE,
      players: prev.players,
      genders: prev.genders,
      likes: prev.likes,
      enabledExtensions: prev.enabledExtensions,
      customCards: prev.customCards,
      cardsPerTurn: prev.cardsPerTurn,
      maxRounds: prev.maxRounds,
      genderMatch: prev.genderMatch,
    }));
  }, []);

  return { state, startGame, playAgain, pickCard, skipCards, undo, canUndo: undoStack.length > 0, resetGame };
}
