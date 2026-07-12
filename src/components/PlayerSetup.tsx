import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Minus, Play, PlusCircle, Trash2, Layers } from "lucide-react";
import { ALL_EXTENSIONS, DEFAULT_CARDS, type Extension, type Card } from "@/data/cards";
import { CustomCardDialog } from "@/components/CustomCardDialog";
import { useGame } from "@/context/GameContext";

interface PlayerSetupProps {
  onStart: (players: string[], extensions: Extension[], customCards: Card[], cardsPerTurn: number) => void;
  /** Prefill from the previous game so "New Game" keeps the same crew and settings */
  initialPlayers?: string[];
  initialExtensions?: Extension[];
  initialCardsPerTurn?: number;
}

export function PlayerSetup({ onStart, initialPlayers, initialExtensions, initialCardsPerTurn }: PlayerSetupProps) {
  const { customCards, removeCustomCard } = useGame();
  const [playerCount, setPlayerCount] = useState(() =>
    initialPlayers && initialPlayers.length >= 2 ? Math.min(15, initialPlayers.length) : 4
  );
  const [names, setNames] = useState<string[]>(() => {
    const base = Array(15).fill("");
    initialPlayers?.slice(0, 15).forEach((n, i) => (base[i] = n));
    return base;
  });
  const [enabledExtensions, setEnabledExtensions] = useState<Set<Extension>>(
    () => new Set(initialExtensions?.length ? initialExtensions : ["ORIGINAL"])
  );
  const [cardsPerTurn, setCardsPerTurn] = useState(initialCardsPerTurn ?? 3);

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const toggleExtension = (ext: Extension) => {
    setEnabledExtensions((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) {
        if (next.size > 1) next.delete(ext);
      } else {
        next.add(ext);
      }
      return next;
    });
  };

  // The deck must hold at least one full turn of cards
  const availableCardCount = [...DEFAULT_CARDS, ...customCards].filter((c) =>
    enabledExtensions.has(c.extension as Extension)
  ).length;
  const deckTooSmall = availableCardCount < cardsPerTurn;

  const handleStart = () => {
    const playerNames = names
      .slice(0, playerCount)
      .map((n, i) => n.trim() || `Player ${i + 1}`);
    onStart(playerNames, Array.from(enabledExtensions), customCards, cardsPerTurn);
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-primary">
            THIRST
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            The ultimate drinking card game
          </p>
        </div>

        {/* Player count */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Players</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setPlayerCount(Math.max(2, playerCount - 1))} disabled={playerCount <= 2}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-display text-4xl font-bold text-primary">{playerCount}</span>
            <Button variant="outline" size="icon" onClick={() => setPlayerCount(Math.min(15, playerCount + 1))} disabled={playerCount >= 15}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards per turn */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Cards per turn</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setCardsPerTurn(n)}
                className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${
                  cardsPerTurn === n
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player names */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Player names
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: playerCount }).map((_, i) => (
              <Input
                key={i}
                placeholder={`Player ${i + 1}`}
                value={names[i]}
                onChange={(e) => updateName(i, e.target.value)}
                className="text-sm"
              />
            ))}
          </div>
        </div>

        {/* Extensions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Card packs
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_EXTENSIONS.map((ext) => (
              <button
                key={ext}
                onClick={() => toggleExtension(ext)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  enabledExtensions.has(ext)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {ext}
              </button>
            ))}
          </div>
        </div>

        {/* Custom cards */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Custom cards ({customCards.length})
            </p>
            <CustomCardDialog
              trigger={
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  <PlusCircle className="h-3.5 w-3.5" /> Add card
                </Button>
              }
            />
          </div>
          {customCards.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No custom cards yet. They also live in the Cards tab.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {customCards.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground">{c.name}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{c.type} • {c.extension}</span>
                  </div>
                  <button onClick={() => removeCustomCard(i)} className="ml-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start */}
        <Button
          onClick={handleStart}
          disabled={deckTooSmall}
          className="w-full gap-2 py-6 font-display text-xl font-bold tracking-wide"
        >
          <Play className="h-5 w-5" />
          START GAME
        </Button>
        {deckTooSmall && (
          <p className="text-center text-xs text-destructive">
            The selected packs only have {availableCardCount} card{availableCardCount === 1 ? "" : "s"} — pick more packs or fewer cards per turn.
          </p>
        )}
      </div>
    </div>
  );
}
