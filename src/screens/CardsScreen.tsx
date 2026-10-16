import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomCardDialog } from "@/components/CustomCardDialog";
import { ALL_EXTENSIONS, DEFAULT_CARDS, type Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { cardText, packLabel, typeLabel } from "@/i18n/cards";

const typeBadgeMap: Record<string, string> = {
  Strike: "bg-card-strike text-white",
  Gift: "bg-card-gift text-white",
  Event: "bg-card-event text-white",
  Equip: "bg-card-equip text-white",
  Special: "bg-card-special text-white",
};

type Filter = "ALL" | (typeof ALL_EXTENSIONS)[number];

function CardRow({ card, onDelete }: { card: Card; onDelete?: () => void }) {
  const { lang } = useT();
  const { name, rule } = cardText(card, lang);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${typeBadgeMap[card.type] || "bg-muted text-muted-foreground"}`}>
            {typeLabel(card.type, lang)}
          </span>
          <h3 className="truncate font-display text-lg font-bold text-foreground">{name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{packLabel(card.extension, lang)}</span>
          {onDelete && (
            <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="font-body text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line">{rule}</p>
    </div>
  );
}

export function CardsScreen() {
  const { customCards, removeCustomCard } = useGame();
  const { t, lang } = useT();
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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-primary">{t("cards.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("cards.count", { n: filtered.length })}
            {filter === "ALL" && customCards.length > 0 ? ` • ${t("cards.custom", { n: customCards.length })}` : ""}
          </p>
        </div>
        <CustomCardDialog
          trigger={
            <Button className="gap-1.5">
              <PlusCircle className="h-4 w-4" /> {t("cards.new")}
            </Button>
          }
        />
      </div>

      {/* Pack filter stays pinned under the status bar while the list scrolls */}
      <div className="sticky top-[var(--safe-top)] z-20 -mx-4 mb-3 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["ALL", ...ALL_EXTENSIONS] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold uppercase transition-colors ${
                filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f === "ALL" ? t("cards.all") : packLabel(f, lang)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-base text-muted-foreground">{t("cards.empty")}</p>
          <CustomCardDialog
            trigger={
              <Button variant="ghost" className="mt-2 gap-1 text-primary">
                <PlusCircle className="h-4 w-4" /> {t("cards.createFirst")}
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
