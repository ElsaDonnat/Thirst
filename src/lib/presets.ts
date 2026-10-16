import type { GameConfig } from "@/hooks/useGameState";

/** A named, reusable game setup, e.g. a friend group with its usual rules */
export type Preset = Omit<GameConfig, "customCards"> & {
  name: string;
  randomOrder: boolean;
};

export const MAX_PRESETS = 3;
const PRESETS_KEY = "thirst-presets-v1";

export function loadPresets(): Preset[] {
  try {
    const saved = JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.slice(0, MAX_PRESETS) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch {
    // Storage unavailable: presets only last until the app closes
  }
}
