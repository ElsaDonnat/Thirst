import { useState, useCallback, useEffect } from "react";
import { DEFAULT_CARDS, type Card, type Extension } from "@/data/cards";

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GameState {
  phase: "setup" | "playing" | "finished";
  players: string[];
  currentPlayerIndex: number;
  deck: Card[];
  currentCards: Card[];
  usedCount: number;
  round: number;
  enabledExtensions: Extension[];
  customCards: Card[];
  cardsPerTurn: number;
}

const INITIAL_STATE: GameState = {
  phase: "setup",
  players: [],
  currentPlayerIndex: 0,
  deck: [],
  currentCards: [],
  usedCount: 0,
  round: 1,
  enabledExtensions: ["ORIGINAL"],
  customCards: [],
  cardsPerTurn: 3,
};

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

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadSavedState() ?? INITIAL_STATE);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — the game just won't survive a restart
    }
  }, [state]);

  const startGame = useCallback((playerNames: string[], enabledExtensions: Extension[], customCards: Card[], cardsPerTurn: number) => {
    const allCards = [...DEFAULT_CARDS, ...customCards].filter(
      (c) => enabledExtensions.includes(c.extension as Extension)
    );
    const shuffled = shuffle(allCards);
    const drawn = shuffled.slice(0, cardsPerTurn);
    const remaining = shuffled.slice(cardsPerTurn);
    setState({
      phase: "playing",
      players: playerNames,
      currentPlayerIndex: 0,
      deck: remaining,
      currentCards: drawn,
      usedCount: 0,
      round: 1,
      enabledExtensions,
      customCards,
      cardsPerTurn,
    });
  }, []);

  const drawNext = useCallback(() => {
    setState((prev) => {
      const { cardsPerTurn } = prev;
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const newRound = nextPlayerIndex === 0 ? prev.round + 1 : prev.round;

      if (prev.deck.length < cardsPerTurn) {
        const allCards = [...DEFAULT_CARDS, ...prev.customCards].filter(
          (c) => prev.enabledExtensions.includes(c.extension as Extension)
        );
        const reshuffled = shuffle(allCards);
        return {
          ...prev,
          currentPlayerIndex: nextPlayerIndex,
          deck: reshuffled.slice(cardsPerTurn),
          currentCards: reshuffled.slice(0, cardsPerTurn),
          usedCount: 0,
          round: newRound,
        };
      }

      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        currentCards: prev.deck.slice(0, cardsPerTurn),
        deck: prev.deck.slice(cardsPerTurn),
        usedCount: prev.usedCount + cardsPerTurn,
        round: newRound,
      };
    });
  }, []);

  const pickCard = useCallback((_cardIndex: number) => {
    drawNext();
  }, [drawNext]);

  const skipCards = useCallback(() => {
    drawNext();
  }, [drawNext]);

  const resetGame = useCallback(() => {
    // Keep players and settings so the next setup screen is prefilled
    setState((prev) => ({
      ...INITIAL_STATE,
      players: prev.players,
      enabledExtensions: prev.enabledExtensions,
      customCards: prev.customCards,
      cardsPerTurn: prev.cardsPerTurn,
    }));
  }, []);

  return { state, startGame, pickCard, skipCards, resetGame };
}
