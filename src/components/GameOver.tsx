import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { SKIP_SIPS, type GameState } from "@/hooks/useGameState";
import { useT } from "@/i18n";

interface GameOverProps {
  state: GameState;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

export function GameOver({ state, onPlayAgain, onBackToSetup }: GameOverProps) {
  const { t } = useT();
  // A forfeit weighs the same as the sips it replaced
  const ranking = state.players
    .map((name, i) => ({ name, sips: state.sips[i] ?? 0, forfeits: state.forfeits?.[i] ?? 0 }))
    .sort((a, b) => b.sips + b.forfeits * SKIP_SIPS - (a.sips + a.forfeits * SKIP_SIPS));
  const anySips = ranking.some((p) => p.sips > 0 || p.forfeits > 0);
  const rounds = state.maxRounds ?? state.round;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.5rem-var(--safe-top))] w-full max-w-md flex-col px-5 pb-4 pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="text-center"
      >
        <Mascot bob className="mx-auto h-36 w-auto" />
        <h1 className="mt-3 font-display text-4xl font-bold text-brand">{t("over.title")}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("over.rounds", { n: rounds })}
        </p>
      </motion.div>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("over.sipsTitle")}
        </p>
        {anySips ? (
          <div className="space-y-2">
            {ranking.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: 0.1 + i * 0.05 }}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  i === 0 ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="font-display text-lg font-bold text-foreground">{p.name}</span>
                <span className="text-base font-semibold text-muted-foreground">
                  {[p.sips > 0 || p.forfeits === 0 ? t("over.sips", { n: p.sips }) : null, p.forfeits > 0 ? t("history.forfeits", { n: p.forfeits }) : null]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("over.noSips")}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Button onClick={onPlayAgain} className="w-full gap-2 py-6 font-display text-lg font-bold">
          <RotateCcw className="h-5 w-5" /> {t("over.playAgain")}
        </Button>
        <Button onClick={onBackToSetup} variant="outline" className="w-full gap-2 py-5">
          <Settings2 className="h-4 w-4" /> {t("over.change")}
        </Button>
      </div>
    </div>
  );
}
