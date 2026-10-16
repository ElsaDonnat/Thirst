import { Fragment, useCallback, useEffect, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Beer, Check, History, LayoutGrid, Undo2 } from "lucide-react";
import { SKIP_SIPS } from "@/hooks/useGameState";
import { useFitText } from "@/hooks/useFitText";
import type { Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { cardText, packLabel, typeLabel } from "@/i18n/cards";
import { tapFeedback } from "@/lib/native";
import { CheersAnimation } from "@/components/CheersAnimation";
import { HistorySheet } from "@/components/HistorySheet";

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

// How long the "It's your turn" interstitial stays (tap skips it)
const HANDOFF_MS = 1300;

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The rule text with named players picked out in the accent color */
function HighlightedRule({ rule, names }: { rule: string; names: string[] }) {
  if (!names.length) return <>{rule}</>;
  const pattern = new RegExp(`(${names.map(escapeRegExp).join("|")})`, "g");
  return (
    <>
      {rule.split(pattern).map((part, i) =>
        names.includes(part) ? (
          <strong key={i} className="font-bold text-primary">{part}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function CardFace({ card, players, size }: { card: Card; players: string[]; size: "small" | "large" }) {
  const { lang } = useT();
  const { name, rule, names } = cardText(card, lang, players);
  const ruleRef = useFitText<HTMLParagraphElement>(14, size === "large" ? 40 : 24, [rule, size]);

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 text-left shadow-sm ${size === "large" ? "p-6 shadow-xl" : "p-4"} ${typeColorMap[card.type] || "border-border bg-card"} bg-card`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${typeBadgeMap[card.type] || "bg-muted text-muted-foreground"}`}>
          {typeLabel(card.type, lang)}
        </span>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {packLabel(card.extension, lang)}
        </span>
      </div>
      <h3 className={`font-display font-bold leading-tight text-foreground ${size === "large" ? "mt-2 text-4xl" : "text-2xl"}`}>{name}</h3>
      <p ref={ruleRef} className={`min-h-0 flex-1 overflow-hidden font-body leading-snug text-foreground/85 whitespace-pre-line ${size === "large" ? "mt-3" : "mt-1"}`}>
        <HighlightedRule rule={rule} names={names} />
      </p>
    </div>
  );
}

export function GameBoard() {
  const { state, pickCard, skipCards, undo, canUndo, leaveGame, settings } = useGame();
  const { t } = useT();
  const [focused, setFocused] = useState<number | null>(null);
  const [cheering, setCheering] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const cardsLeft = state.deck.length + state.currentCards.length;
  const turnKey = `${state.round}-${state.currentPlayerIndex}-${state.usedCount}-${state.history.length}`;
  const roundText = state.maxRounds
    ? t("game.roundOf", { round: state.round, max: state.maxRounds })
    : t("game.round", { round: state.round });

  const feedback = useCallback(() => {
    if (settings.haptics) tapFeedback();
  }, [settings.haptics]);

  // Full-screen "It's your turn" interstitial at the start of every turn
  const [handoff, setHandoff] = useState(true);
  useEffect(() => {
    setHandoff(true);
    setFocused(null);
    setCheering(false);
    const timer = window.setTimeout(() => setHandoff(false), HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [turnKey]);

  const finishSkip = useCallback(() => {
    setCheering(false);
    skipCards();
  }, [skipCards]);

  if (handoff) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-4.5rem-var(--safe-top))] w-full max-w-md flex-col px-4 pb-3 pt-4">
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
            className="text-base font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {t("game.yourTurn")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="mt-2 max-w-full break-words px-2 text-center font-display text-7xl font-bold leading-none text-primary"
          >
            {currentPlayer}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="mt-6 text-center"
          >
            <p className="text-lg font-semibold text-foreground/70">{roundText}</p>
            <p className="mt-1 text-base text-muted-foreground">{t("game.handoffHint", { sips: SKIP_SIPS })}</p>
          </motion.div>
        </motion.button>
      </div>
    );
  }

  return (
    <LayoutGroup id={turnKey}>
      <motion.div
        key={`board-${turnKey}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="relative mx-auto flex h-[calc(100dvh-4.5rem-var(--safe-top))] w-full max-w-md flex-col px-4 pb-3 pt-4 sm:max-w-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-3xl font-bold leading-tight text-primary">{currentPlayer}</h2>
            <p className="text-base text-muted-foreground">
              {roundText} • {t("game.cardsLeft", { n: cardsLeft })}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {canUndo && (
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={undo} aria-label={t("game.undoTurn")}>
                <Undo2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setHistoryOpen(true)} aria-label={t("game.history")}>
              <History className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={leaveGame} aria-label={t("game.menu")}>
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cards fill the remaining height, no scrolling */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
          {state.currentCards.map((card, i) =>
            focused === i ? (
              <div key={i} className="min-h-0 flex-1" />
            ) : (
              <motion.button
                key={i}
                layoutId={`card-${i}`}
                onClick={() => {
                  if (focused !== null) return;
                  feedback();
                  setFocused(i);
                }}
                className="min-h-0 flex-1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: focused === null ? 1 : 0.2, y: 0 }}
                transition={{ duration: 0.18, delay: focused === null ? i * 0.05 : 0 }}
              >
                <CardFace card={card} players={state.players} size="small" />
              </motion.button>
            ),
          )}
        </div>

        <Button
          onClick={() => {
            feedback();
            setCheering(true);
          }}
          disabled={focused !== null}
          variant="outline"
          className="mt-3 h-auto w-full shrink-0 gap-2 border-2 border-destructive/60 py-5 text-lg font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Beer className="h-6 w-6" />
          {t("game.skip", { sips: SKIP_SIPS })}
        </Button>

        {/* The chosen card grows into the middle so everyone can read it */}
        {focused !== null && state.currentCards[focused] && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col gap-4 bg-background/85 px-4 pb-3 pt-4 backdrop-blur-sm"
            initial={{ backgroundColor: "hsla(220, 20%, 97%, 0)" }}
            animate={{ backgroundColor: "hsla(220, 20%, 97%, 0.85)" }}
          >
            <motion.div layoutId={`card-${focused}`} className="min-h-0 flex-1" transition={{ duration: 0.32, ease: [0.2, 0.9, 0.3, 1] }}>
              <CardFace card={state.currentCards[focused]} players={state.players} size="large" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.18 }}
              className="flex shrink-0 gap-2"
            >
              <Button variant="outline" onClick={() => setFocused(null)} className="h-auto gap-1.5 px-4 py-5 text-base">
                <Undo2 className="h-5 w-5" /> {t("game.undo")}
              </Button>
              <Button
                onClick={() => {
                  feedback();
                  pickCard(focused);
                }}
                className="h-auto flex-1 gap-2 py-5 font-display text-lg font-bold"
              >
                <Check className="h-5 w-5" /> {t("game.done")}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {cheering && (
          <CheersAnimation
            title={t("game.cheers")}
            subtitle={t("game.sipsFor", { player: currentPlayer, sips: SKIP_SIPS })}
            onDone={finishSkip}
          />
        )}

        <HistorySheet state={state} open={historyOpen} onOpenChange={setHistoryOpen} />
      </motion.div>
    </LayoutGroup>
  );
}
