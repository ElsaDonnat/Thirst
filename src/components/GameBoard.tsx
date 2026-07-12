import { Button } from "@/components/ui/button";
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

function CardDisplay({ card, index, onPick }: { card: Card; index: number; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={`group relative flex min-h-[240px] flex-col rounded-xl border-2 p-5 text-left shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-lg ${typeColorMap[card.type] || "border-border bg-card"}`}
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
      <span className="mt-2 self-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Choose this
      </span>
    </button>
  );
}

export function GameBoard({ state, onPickCard, onSkip, onReset }: GameBoardProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const cardsLeft = state.deck.length + state.currentCards.length;
  const gridCols = state.cardsPerTurn === 1 ? "max-w-sm" : state.cardsPerTurn === 2 ? "sm:grid-cols-2 max-w-xl" : "sm:grid-cols-3 max-w-2xl";

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="mb-2 flex w-full max-w-2xl items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Round {state.round} • {cardsLeft} cards left
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <RotateCcw className="mr-1 h-4 w-4" /> New Game
        </Button>
      </div>

      {/* Current player */}
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">It's your turn</p>
        <h2 className="font-display text-5xl font-bold text-primary">
          {currentPlayer}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Pick one challenge — or take 15 sips!</p>
      </div>

      {/* Cards */}
      <div className={`mb-8 grid w-full grid-cols-1 gap-4 ${gridCols}`}>
        {state.currentCards.map((card, i) => (
          <CardDisplay key={`${card.name}-${i}`} card={card} index={i} onPick={() => onPickCard(i)} />
        ))}
      </div>

      {/* Skip button */}
      <Button
        onClick={onSkip}
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
