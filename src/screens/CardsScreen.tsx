import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomCardDialog } from "@/components/CustomCardDialog";
import { ALL_EXTENSIONS, DEFAULT_CARDS, type Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";

const typeBadgeMap: Record<string, string> = {
  Strike: "bg-card-strike text-white",
  Gift: "bg-card-gift text-white",
  Event: "bg-card-event text-white",
  Equip: "bg-card-equip text-white",
  Special: "bg-card-special text-white",
};

type Filter = "ALL" | (typeof ALL_EXTENSIONS)[number];

function CardRow({ card, onDelete }: { card: Card; onDelete?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeMap[card.type] || "bg-muted text-muted-foreground"}`}>
            {card.type}
          </span>
          <h3 className="truncate font-display text-base font-bold text-foreground">{card.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{card.extension}</span>
          {onDelete && (
            <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="font-body text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{card.rule}</p>
    </div>
  );
}

export function CardsScreen() {
  const { customCards, removeCustomCard } = useGame();
  const [filter, setFilter] = useState<Filter>("ALL");

  const withOrigin: { card: Card; customIndex: number | null }[] = [
    ...DEFAULT_CARDS.map((card) => ({ card, customIndex: null })),
    ...customCards.map((card, i) => ({ card, customIndex: i as number | null })),
  ];
  const filtered = withOrigin.filter(({ card, customIndex }) => {
    if (filter === "ALL") return true;
    if (filter === "CUSTOM") return customIndex !== null || card.extension === "CUSTOM";
    return card.extension === filter;
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Cards</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} card{filtered.length === 1 ? "" : "s"}
            {filter !== "ALL" ? ` in ${filter}` : ` • ${customCards.length} custom`}
          </p>
        </div>
        <CustomCardDialog
          trigger={
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" /> New card
            </Button>
          }
        />
      </div>

      {/* Pack filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["ALL", ...ALL_EXTENSIONS] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Card list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No cards here yet.</p>
          <CustomCardDialog
            trigger={
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-primary">
                <PlusCircle className="h-3.5 w-3.5" /> Create the first one
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(({ card, customIndex }, i) => (
            <CardRow
              key={`${card.name}-${i}`}
              card={card}
              onDelete={customIndex !== null ? () => removeCustomCard(customIndex) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
