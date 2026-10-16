import { useState, useCallback, useEffect } from "react";
import { DEFAULT_CARDS, LINK_KIND, type Card, type Extension, type LinkKind } from "@/data/cards";
import { involvesDrinking, randomForfeit } from "@/data/forfeits";
import { canGetSpicy, personalizeCard, type Gender, type Likes, type Relationship } from "@/lib/targeting";

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
  /** Players who don't drink: they do forfeits instead */
  sober: boolean[];
  genders: (Gender | null)[];
  /** Who each player is into, for flirty matching */
  likes: Likes[];
  /** Who's in a relationship, and with whom if they're playing too */
  relationships: Relationship[];
  enabledExtensions: Extension[];
  customCards: Card[];
  cardsPerTurn: number;
  /** null means the game goes on until the players stop it */
  maxRounds: number | null;
  /** Flirty cards that name someone follow who-likes-who */
  genderMatch: boolean;
}

/** From a Buddy card, `to` drinks whenever `from` does; Mates go both ways */
export interface Link {
  from: number;
  to: number;
  kind: LinkKind;
}

export interface TurnRecord {
  round: number;
  player: number;
  /** The card played, or null when the player took the sips or a forfeit */
  card: Card | null;
  /** The forfeit done instead of drinking, for a skip by or linked to a sober player */
  forfeit?: number;
  /** Linked players who drank along with this skip */
  alsoDrank?: number[];
  /** Linked players who did the forfeit too */
  alsoForfeit?: number[];
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
  /** Sips each player took by skipping (or by being linked), indexed like players */
  sips: number[];
  /** Forfeits each sober player did */
  forfeits: number[];
  /** How often each player has been named by a played card */
  targetCounts: number[];
  links: Link[];
}

export const SKIP_SIPS = 15;

const INITIAL_STATE: GameState = {
  phase: "setup",
  players: [],
  sober: [],
  genders: [],
  likes: [],
  relationships: [],
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
  forfeits: [],
  targetCounts: [],
  history: [],
  links: [],
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

/** Everyone who has to follow `player` when they drink (or do a forfeit) */
export function followersOf(links: Link[], player: number): number[] {
  const out = new Set<number>();
  for (const l of links ?? []) {
    if (l.from === player) out.add(l.to);
    if (l.kind === "mates" && l.to === player) out.add(l.from);
  }
  out.delete(player);
  return [...out];
}

type DealState = Pick<GameState, "players" | "sober" | "genders" | "likes" | "relationships" | "targetCounts" | "genderMatch">;

/**
 * Draws a hand for `playerIndex` from the top of `source`, naming players on
 * cards that have slots. Spicy cards are passed over for a player who can't
 * get them and stay in the deck, in order, for someone else. A sober player
 * gets a forfeit attached to any card that involves drinking.
 */
function drawHand(
  deck: Card[],
  count: number,
  state: DealState,
  playerIndex: number,
  refill: () => Card[],
): { hand: Card[]; rest: Card[] } {
  const relationships = state.relationships ?? [];
  const allowSpicy = canGetSpicy(playerIndex, relationships, state.genderMatch);
  let source = deck;
  const picked: number[] = [];
  const pickAllowed = () => {
    for (let i = 0; i < source.length && picked.length < count; i++) {
      if (!picked.includes(i) && (allowSpicy || !source[i].spicy)) picked.push(i);
    }
  };
  pickAllowed();
  // Only spicy cards left on top: shuffle in a fresh deck rather than deal one
  if (picked.length < count) {
    source = [...source, ...refill()];
    pickAllowed();
  }
  // A pack with nothing else at all still deals a full hand
  for (let i = 0; i < source.length && picked.length < count; i++) {
    if (!picked.includes(i)) picked.push(i);
  }
  const isSober = !!state.sober?.[playerIndex];
  const hand = picked.map((i) => {
    const card = personalizeCard(source[i], {
      players: state.players,
      sober: state.sober ?? [],
      genders: state.genders,
      likes: state.likes ?? [],
      relationships,
      targetCounts: state.targetCounts,
      currentPlayerIndex: playerIndex,
      genderMatch: state.genderMatch,
    });
    return isSober && involvesDrinking(card.rule) ? { ...card, forfeit: randomForfeit() } : card;
  });
  return { hand, rest: source.filter((_, i) => !picked.includes(i)) };
}

export function freshGame(config: GameConfig): GameState {
  const shuffled = buildDeck(config);
  const base: GameState = {
    ...INITIAL_STATE,
    ...config,
    phase: "playing",
    sips: config.players.map(() => 0),
    forfeits: config.players.map(() => 0),
    targetCounts: config.players.map(() => 0),
    history: [],
    links: [],
  };
  const { hand, rest } = drawHand(shuffled, config.cardsPerTurn, base, 0, () => buildDeck(config));
  return { ...base, currentCards: hand, deck: rest };
}

export interface TurnChoice {
  /** The card played; null means the player took the sips or a forfeit */
  pickedIndex: number | null;
  /** For a Buddy or Mates card where the player chose: who they picked */
  chosen?: number;
  /** The forfeit shown, when a sober player is involved in a skip */
  forfeit?: number;
}

/** The state after the current player's turn */
export function nextTurn(prev: GameState, choice: TurnChoice): GameState {
  const { cardsPerTurn } = prev;
  const current = prev.currentPlayerIndex;
  const skipped = choice.pickedIndex === null;
  const sips = prev.players.map((_, i) => prev.sips[i] ?? 0);
  const forfeits = prev.players.map((_, i) => prev.forfeits?.[i] ?? 0);
  const record: TurnRecord = { round: prev.round, player: current, card: null };
  let links = prev.links ?? [];

  if (skipped) {
    // Linked players follow: they drink along, or do a forfeit if either
    // side of the link is sober
    const currentSober = !!prev.sober?.[current];
    if (currentSober) forfeits[current]++;
    else sips[current] += SKIP_SIPS;
    const alsoDrank: number[] = [];
    const alsoForfeit: number[] = [];
    for (const f of followersOf(links, current)) {
      if (currentSober || prev.sober?.[f]) {
        forfeits[f]++;
        alsoForfeit.push(f);
      } else {
        sips[f] += SKIP_SIPS;
        alsoDrank.push(f);
      }
    }
    if (currentSober || alsoForfeit.length) record.forfeit = choice.forfeit;
    if (alsoDrank.length) record.alsoDrank = alsoDrank;
    if (alsoForfeit.length) record.alsoForfeit = alsoForfeit;
  } else {
    const card = prev.currentCards[choice.pickedIndex!] ?? null;
    record.card = card;
    const kind = card?.id !== undefined ? LINK_KIND[card.id] : undefined;
    const target = card?.targets?.[0] ?? choice.chosen;
    if (kind && target !== undefined && target !== current) {
      const duplicate = links.some((l) => l.kind === kind && l.from === current && l.to === target);
      if (!duplicate) links = [...links, { from: current, to: target, kind }];
    }
  }

  const picked = record.card;
  const targetCounts = prev.players.map((_, i) =>
    (prev.targetCounts[i] ?? 0) + (picked?.targets?.includes(i) ? 1 : 0)
  );
  const history = [...prev.history, record];
  const nextPlayerIndex = (current + 1) % prev.players.length;
  const newRound = nextPlayerIndex === 0 ? prev.round + 1 : prev.round;
  const next = { ...prev, sips, forfeits, targetCounts, history, links };

  if (prev.maxRounds !== null && newRound > prev.maxRounds) {
    return { ...next, phase: "finished" };
  }

  const reshuffle = prev.deck.length < cardsPerTurn;
  const source = reshuffle ? buildDeck(prev) : prev.deck;
  const { hand, rest } = drawHand(source, cardsPerTurn, next, nextPlayerIndex, () => buildDeck(prev));
  return {
    ...next,
    currentPlayerIndex: nextPlayerIndex,
    currentCards: hand,
    deck: rest,
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

  const advance = useCallback((choice: TurnChoice) => {
    setUndoStack((stack) => [...stack, state].slice(-UNDO_DEPTH));
    setState(nextTurn(state, choice));
  }, [state]);

  const pickCard = useCallback(
    (cardIndex: number, chosen?: number) => advance({ pickedIndex: cardIndex, chosen }),
    [advance],
  );
  const skipCards = useCallback((forfeit?: number) => advance({ pickedIndex: null, forfeit }), [advance]);

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
      sober: prev.sober,
      genders: prev.genders,
      likes: prev.likes,
      relationships: prev.relationships,
      enabledExtensions: prev.enabledExtensions,
      customCards: prev.customCards,
      cardsPerTurn: prev.cardsPerTurn,
      maxRounds: prev.maxRounds,
      genderMatch: prev.genderMatch,
    }));
  }, []);

  return { state, startGame, playAgain, pickCard, skipCards, undo, canUndo: undoStack.length > 0, resetGame };
}
