import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Bookmark, Play, Plus, X } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { packLabel } from "@/i18n/cards";
import type { Preset } from "@/lib/presets";

interface PlayHomeProps {
  onNewGame: () => void;
  onLoadPreset: (preset: Preset) => void;
}

/** What the Play tab opens on: continue, start fresh, or start from a preset */
export function PlayHome({ onNewGame, onLoadPreset }: PlayHomeProps) {
  const { state, resumeGame, resetGame, presets, deletePreset } = useGame();
  const { t, lang } = useT();
  const inProgress = state.phase === "playing";
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [confirmStartOver, setConfirmStartOver] = useState(false);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4.5rem-var(--safe-top))] w-full max-w-lg flex-col justify-center px-5 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center text-center"
      >
        <Mascot bob className="h-[26dvh] max-h-60 w-auto" />
        <h1 className="title-retro mt-2 text-7xl">THIRST</h1>
        <p className="mt-2 max-w-xs text-base text-muted-foreground">{t("home.subtitle")}</p>
      </motion.div>

      <div className="mt-8 space-y-3">
        {inProgress && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4">
            <p className="font-display text-lg font-bold text-brand">{t("setup.resumeTitle")}</p>
            <p className="text-[15px] text-foreground/80">
              {t("setup.resumeDetail", { round: state.round, player: state.players[state.currentPlayerIndex] })}
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={resumeGame} className="h-auto flex-1 gap-2 py-4 text-base font-bold">
                <Play className="h-5 w-5" /> {t("setup.resume")}
              </Button>
              <Button variant="outline" onClick={() => setConfirmStartOver(true)} className="h-auto py-4 text-base">
                {t("setup.startOver")}
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={onNewGame}
          variant={inProgress ? "outline" : "default"}
          className="h-auto w-full gap-2 py-5 font-display text-xl font-bold"
        >
          <Plus className="h-5 w-5" /> {t("home.newGame")}
        </Button>

        {presets.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("home.presets")}</p>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <div key={i} className="flex items-stretch gap-2">
                  <button
                    onClick={() => onLoadPreset(p)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left active:bg-secondary"
                  >
                    <Bookmark className="h-5 w-5 shrink-0 fill-primary/20 text-brand" />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t("home.presetPlayers", { n: p.players.length })} • {p.enabledExtensions.map((e) => packLabel(e, lang)).join(", ")}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setToDelete(i)}
                    aria-label={t("home.delete")}
                    className="flex w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("home.deletePresetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("home.deletePresetBody", { name: toDelete !== null ? presets[toDelete]?.name ?? "" : "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete !== null && deletePreset(toDelete)}>{t("home.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmStartOver} onOpenChange={setConfirmStartOver}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("setup.startOverTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("setup.startOverBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={resetGame}>{t("setup.startOver")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
