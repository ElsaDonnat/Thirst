import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useGameState } from "@/hooks/useGameState";
import type { Card } from "@/data/cards";
import type { Lang } from "@/i18n/strings";
import { loadPresets, MAX_PRESETS, savePresets, type Preset } from "@/lib/presets";

const CUSTOM_CARDS_KEY = "thirst-custom-cards-v1";
export const SETTINGS_KEY = "thirst-settings-v1";

interface Settings {
  haptics: boolean;
  language: Lang;
}

const DEFAULT_SETTINGS: Settings = { haptics: true, language: "en" };

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
    // Storage unavailable: data just won't survive a restart
  }
}

type GameContextValue = ReturnType<typeof useGameState> & {
  customCards: Card[];
  addCustomCard: (card: Card) => void;
  removeCustomCard: (index: number) => void;
  settings: Settings;
  setHaptics: (on: boolean) => void;
  setLanguage: (lang: Lang) => void;
  clearAllData: () => void;
  /** Whether the Play tab shows the game (true) or the home/setup pages (false) */
  inGame: boolean;
  resumeGame: () => void;
  leaveGame: () => void;
  presets: Preset[];
  /** Saves into a free slot, or over slot `replace` when all are taken */
  savePreset: (preset: Preset, replace?: number) => void;
  deletePreset: (index: number) => void;
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

  // Always open on the home page, even when a saved game exists; the home
  // page offers to continue it
  const [inGame, setInGame] = useState(false);
  const { startGame: startGameRaw, resetGame: resetGameRaw } = game;
  const startGame = useCallback<typeof startGameRaw>((...args) => {
    startGameRaw(...args);
    setInGame(true);
  }, [startGameRaw]);
  const resetGame = useCallback(() => {
    resetGameRaw();
    setInGame(false);
  }, [resetGameRaw]);
  const resumeGame = useCallback(() => setInGame(true), []);
  const leaveGame = useCallback(() => setInGame(false), []);

  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  useEffect(() => savePresets(presets), [presets]);
  const savePreset = useCallback((preset: Preset, replace?: number) => {
    setPresets((prev) => {
      // Same name overwrites, so re-saving a group just updates it
      const existing = prev.findIndex((p) => p.name.trim().toLowerCase() === preset.name.trim().toLowerCase());
      const slot = existing >= 0 ? existing : prev.length < MAX_PRESETS ? prev.length : replace ?? MAX_PRESETS - 1;
      const next = [...prev];
      next[slot] = preset;
      return next;
    });
  }, []);
  const deletePreset = useCallback((index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index));
  }, []);

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

  const setLanguage = useCallback((language: Lang) => {
    setSettings((prev) => ({ ...prev, language }));
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

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
      value={{
        ...game,
        startGame,
        resetGame,
        customCards,
        addCustomCard,
        removeCustomCard,
        settings,
        setHaptics,
        setLanguage,
        clearAllData,
        inGame,
        resumeGame,
        leaveGame,
        presets,
        savePreset,
        deletePreset,
      }}
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
