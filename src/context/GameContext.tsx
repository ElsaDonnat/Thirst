import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useGameState } from "@/hooks/useGameState";
import type { Card } from "@/data/cards";

const CUSTOM_CARDS_KEY = "thirst-custom-cards-v1";
const SETTINGS_KEY = "thirst-settings-v1";

interface Settings {
  haptics: boolean;
}

const DEFAULT_SETTINGS: Settings = { haptics: true };

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — data just won't survive a restart
  }
}

type GameContextValue = ReturnType<typeof useGameState> & {
  customCards: Card[];
  addCustomCard: (card: Card) => void;
  removeCustomCard: (index: number) => void;
  settings: Settings;
  setHaptics: (on: boolean) => void;
  clearAllData: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameState();
  // Fall back to the cards snapshotted in a saved game (pre-context versions stored them there)
  const [customCards, setCustomCards] = useState<Card[]>(
    () => load<Card[]>(CUSTOM_CARDS_KEY) ?? game.state.customCards
  );
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...load<Settings>(SETTINGS_KEY),
  }));

  useEffect(() => save(CUSTOM_CARDS_KEY, customCards), [customCards]);
  useEffect(() => save(SETTINGS_KEY, settings), [settings]);

  const addCustomCard = useCallback((card: Card) => {
    setCustomCards((prev) => [...prev, card]);
  }, []);

  const removeCustomCard = useCallback((index: number) => {
    setCustomCards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setHaptics = useCallback((on: boolean) => {
    setSettings((prev) => ({ ...prev, haptics: on }));
  }, []);

  const clearAllData = useCallback(() => {
    try {
      localStorage.clear();
    } catch {
      // nothing to clear
    }
    window.location.reload();
  }, []);

  return (
    <GameContext.Provider
      value={{ ...game, customCards, addCustomCard, removeCustomCard, settings, setHaptics, clearAllData }}
    >
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
