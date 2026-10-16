import { Beer, Layers, Link2, Zap } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SKIP_SIPS, type GameState, type TurnRecord } from "@/hooks/useGameState";
import { FORFEITS } from "@/data/forfeits";
import { useT } from "@/i18n";
import { cardText } from "@/i18n/cards";

interface HistorySheetProps {
  state: GameState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Scoreboard, active Buddy/Mates links, and a turn-by-turn log, newest first */
export function HistorySheet({ state, open, onOpenChange }: HistorySheetProps) {
  const { t, lang } = useT();
  const cardsPlayed = state.players.map((_, i) => state.history.filter((h) => h.player === i && h.card).length);
  const ranking = state.players
    .map((name, i) => ({ name, sips: state.sips[i] ?? 0, forfeits: state.forfeits?.[i] ?? 0, cards: cardsPlayed[i] }))
    .sort((a, b) => b.sips + b.forfeits * SKIP_SIPS - (a.sips + a.forfeits * SKIP_SIPS) || b.cards - a.cards);
  const log = [...state.history].reverse();
  const links = state.links ?? [];

  const describe = (h: TurnRecord) => {
    if (h.card) return t("history.played", { card: cardText(h.card, lang, state.players).name });
    const main = h.forfeit !== undefined && state.sober?.[h.player]
      ? `${t("history.forfeited")}: ${FORFEITS[h.forfeit]?.[lang] ?? ""}`
      : t("history.skipped", { sips: SKIP_SIPS });
    const also = [...(h.alsoDrank ?? []), ...(h.alsoForfeit ?? [])].map((i) => state.players[i]);
    return also.length ? `${main} (${t("history.also", { names: also.join(", ") })})` : main;
  };

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
              <div key={p.name} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/70 px-3 py-2.5">
                <span className="truncate text-base font-bold">{p.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-4 w-4" />{t("history.cards", { n: p.cards })}</span>
                  {p.forfeits > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-primary"><Zap className="h-4 w-4" />{t("history.forfeits", { n: p.forfeits })}</span>
                  )}
                  {(p.sips > 0 || p.forfeits === 0) && (
                    <span className="flex items-center gap-1 font-semibold text-destructive"><Beer className="h-4 w-4" />{t("over.sips", { n: p.sips })}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {links.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("history.links")}</p>
              <div className="space-y-1">
                {links.map((l, i) => (
                  <p key={i} className="flex items-center gap-2 text-[15px]">
                    <Link2 className="h-4 w-4 shrink-0 text-primary" />
                    {l.kind === "mates"
                      ? t("history.mates", { a: state.players[l.from], b: state.players[l.to] })
                      : t("history.buddy", { to: state.players[l.to], from: state.players[l.from] })}
                  </p>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 space-y-1">
            {log.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{t("history.empty")}</p>
            ) : (
              log.map((h, i) => (
                <div key={i} className="flex items-baseline gap-3 border-b border-border/60 py-2 last:border-0">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">{t("game.round", { round: h.round })}</span>
                  <span className="text-[15px]">
                    <strong>{state.players[h.player]}</strong> {describe(h)}
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
