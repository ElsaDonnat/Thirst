import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Beer, RotateCcw } from "lucide-react";
import type { GameState } from "@/hooks/useGameState";
import type { Card } from "@/data/cards";

interface GameBoardProps {
  state: GameState;
  onPickCard: (index: number) => void;
  onSkip: () => void;
  onReset: () => void;
}

const typeColorMap: Record<string, string> = {
  Strike: "border-card-strike bg-card-strike/10",
  Gift: "border-card-gift bg-card-gift/10",
  Event: "border-card-event bg-card-event/10",
  Equip: "border-card-equip bg-card-equip/10",
  Special: "border-card-special bg-card-special/10",
};

const typeBadgeMap: Record<string, string> = {
  Strike: "bg-card-strike text-white",
  Gift: "bg-card-gift text-white",
  Event: "bg-card-event text-white",
  Equip: "bg-card-equip text-white",
  Special: "bg-card-special text-white",
};

function CardDisplay({ card, picked, onPick }: { card: Card; picked: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-xl border-2 p-3 text-left shadow-sm ${
        typeColorMap[card.type] || "border-border bg-card"
      } ${picked ? "ring-2 ring-primary shadow-lg" : ""}`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${typeBadgeMap[card.type] || "bg-muted text-muted-foreground"}`}>
          {card.type}
        </span>
        <h3 className="min-w-0 truncate font-display text-base font-bold leading-tight text-foreground">{card.name}</h3>
        <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">{card.extension}</span>
      </div>
      <p className="min-h-0 flex-1 overflow-y-auto font-body text-xs leading-snug text-foreground/80 whitespace-pre-line">{card.rule}</p>
      {picked && (
        <span className="absolute inset-0 flex items-center justify-center bg-primary/10">
          <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-md">Chosen!</span>
        </span>
      )}
    </button>
  );
}

// How long the "chosen" flash shows before the next turn takes over
const PICK_ANIMATION_MS = 380;
// How long the "It's your turn" interstitial stays (tap skips it)
const HANDOFF_MS = 1300;

export function GameBoard({ state, onPickCard, onSkip, onReset }: GameBoardProps) {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const cardsLeft = state.deck.length + state.currentCards.length;
  const turnKey = `${state.round}-${state.currentPlayerIndex}-${state.usedCount}`;

  // Full-screen "It's your turn" interstitial at the start of every turn
  const [handoff, setHandoff] = useState(true);
  useEffect(() => {
    setHandoff(true);
    const timer = window.setTimeout(() => setHandoff(false), HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [turnKey]);

  const handlePick = (index: number) => {
    if (pickedIndex !== null) return;
    setPickedIndex(index);
    window.setTimeout(() => {
      setPickedIndex(null);
      onPickCard(index);
    }, PICK_ANIMATION_MS);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.5rem-var(--safe-top))] w-full max-w-md flex-col overflow-hidden px-4 pb-2 pt-3 sm:max-w-2xl">
      {handoff ? (
        <motion.button
          key={`handoff-${turnKey}`}
          onClick={() => setHandoff(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex h-full w-full flex-col items-center justify-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm uppercase tracking-widest text-muted-foreground"
          >
            It's your turn
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="mt-1 max-w-full truncate px-2 font-display text-6xl font-bold text-primary"
          >
            {currentPlayer}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            Pick one challenge — or take 15 sips
          </motion.p>
        </motion.button>
      ) : (
        <motion.div
          key={`board-${turnKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-full min-h-0 flex-col"
        >
          {/* Compact header: current player + round info + reset */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-display text-lg font-bold text-primary">{currentPlayer}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                Round {state.round} • {cardsLeft} left
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> New
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">End this game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The current round will be lost. Players and settings are kept for the next game.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep playing</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset}>End game</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Cards fill the remaining height — no scrolling */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
            {state.currentCards.map((card, i) => (
              <motion.div
                key={`${card.name}-${i}`}
                className="min-h-0 flex-1"
                initial={{ opacity: 0, y: 16 }}
                animate={
                  pickedIndex === null
                    ? { opacity: 1, y: 0, scale: 1 }
                    : pickedIndex === i
                      ? { opacity: 1, y: 0, scale: 1.03 }
                      : { opacity: 0.25, y: 0, scale: 0.97 }
                }
                transition={{ duration: 0.16, delay: pickedIndex === null ? i * 0.05 : 0 }}
              >
                <CardDisplay card={card} picked={pickedIndex === i} onPick={() => handlePick(i)} />
              </motion.div>
            ))}
          </div>

          {/* Skip */}
          <Button
            onClick={onSkip}
            disabled={pickedIndex !== null}
            variant="outline"
            className="mt-2 w-full shrink-0 gap-2 border-destructive/50 py-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Beer className="h-4 w-4" />
            Take 15 sips instead
          </Button>
        </motion.div>
      )}
    </div>
  );
}
