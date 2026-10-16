import { Beer, Layers } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SKIP_SIPS, type GameState } from "@/hooks/useGameState";
import { useT } from "@/i18n";
import { cardText } from "@/i18n/cards";

interface HistorySheetProps {
  state: GameState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Scoreboard plus a turn-by-turn log, newest first */
export function HistorySheet({ state, open, onOpenChange }: HistorySheetProps) {
  const { t, lang } = useT();
  const cardsPlayed = state.players.map((_, i) => state.history.filter((h) => h.player === i && h.card).length);
  const ranking = state.players
    .map((name, i) => ({ name, sips: state.sips[i] ?? 0, cards: cardsPlayed[i] }))
    .sort((a, b) => b.sips - a.sips || b.cards - a.cards);
  const log = [...state.history].reverse();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="font-display text-2xl">{t("history.title")}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("history.totals")}</p>
          <div className="space-y-1.5">
            {ranking.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-2.5">
                <span className="truncate text-base font-bold">{p.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-4 w-4" />{t("history.cards", { n: p.cards })}</span>
                  <span className="flex items-center gap-1 font-semibold text-destructive"><Beer className="h-4 w-4" />{t("over.sips", { n: p.sips })}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-1">
            {log.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{t("history.empty")}</p>
            ) : (
              log.map((h, i) => (
                <div key={i} className="flex items-baseline gap-3 border-b border-border/60 py-2 last:border-0">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">{t("game.round", { round: h.round })}</span>
                  <span className="text-[15px]">
                    <strong>{state.players[h.player]}</strong>{" "}
                    {h.card
                      ? t("history.played", { card: cardText(h.card, lang, state.players).name })
                      : t("history.skipped", { sips: SKIP_SIPS })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
