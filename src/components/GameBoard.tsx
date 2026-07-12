import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function CardDisplay({ card, index, picked, onPick }: { card: Card; index: number; picked: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={`group relative flex h-full min-h-[240px] w-full flex-col rounded-xl border-2 p-5 text-left shadow-sm transition-shadow duration-200 ${
        typeColorMap[card.type] || "border-border bg-card"
      } ${picked ? "ring-2 ring-primary shadow-lg" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeMap[card.type] || "bg-muted text-muted-foreground"}`}>
          {card.type}
        </span>
        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
      </div>
      <h3 className="mb-2 font-display text-xl font-bold text-foreground">{card.name}</h3>
      <p className="flex-1 font-body text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{card.rule}</p>
      <span className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{card.extension}</span>
      {picked && (
        <span className="mt-2 self-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
          Chosen!
        </span>
      )}
    </button>
  );
}

// How long the "chosen" flash shows before the next turn slides in
const PICK_ANIMATION_MS = 380;

export function GameBoard({ state, onPickCard, onSkip, onReset }: GameBoardProps) {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const cardsLeft = state.deck.length + state.currentCards.length;
  const gridCols = state.cardsPerTurn === 1 ? "max-w-sm" : state.cardsPerTurn === 2 ? "sm:grid-cols-2 max-w-xl" : "sm:grid-cols-3 max-w-2xl";
  const turnKey = `${state.round}-${state.currentPlayerIndex}-${state.usedCount}`;

  const handlePick = (index: number) => {
    if (pickedIndex !== null) return;
    setPickedIndex(index);
    window.setTimeout(() => {
      setPickedIndex(null);
      onPickCard(index);
    }, PICK_ANIMATION_MS);
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="mb-2 flex w-full max-w-2xl items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Round {state.round} • {cardsLeft} cards left
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <RotateCcw className="mr-1 h-4 w-4" /> New Game
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

      {/* Current player */}
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">It's your turn</p>
        <AnimatePresence mode="wait">
          <motion.h2
            key={turnKey}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.15 }}
            className="font-display text-5xl font-bold text-primary"
          >
            {currentPlayer}
          </motion.h2>
        </AnimatePresence>
        <p className="mt-2 text-sm text-muted-foreground">Pick one challenge — or take 15 sips!</p>
      </div>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={turnKey}
          className={`mb-8 grid w-full grid-cols-1 gap-4 ${gridCols}`}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.15 }}
        >
          {state.currentCards.map((card, i) => (
            <motion.div
              key={`${card.name}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={
                pickedIndex === null
                  ? { opacity: 1, y: 0, scale: 1 }
                  : pickedIndex === i
                    ? { opacity: 1, y: 0, scale: 1.05 }
                    : { opacity: 0.25, y: 0, scale: 0.97 }
              }
              transition={{ duration: 0.18, delay: pickedIndex === null ? i * 0.06 : 0 }}
            >
              <CardDisplay card={card} index={i} picked={pickedIndex === i} onPick={() => handlePick(i)} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      <Button
        onClick={onSkip}
        disabled={pickedIndex !== null}
        variant="outline"
        className="gap-2 border-destructive/50 py-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Beer className="h-5 w-5" />
        Take 15 sips instead
      </Button>

      {/* Player list */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {state.players.map((p, i) => (
          <span
            key={p}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              i === state.currentPlayerIndex
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
