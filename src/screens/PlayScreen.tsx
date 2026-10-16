import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlayHome } from "@/components/PlayHome";
import { SetupFlow } from "@/components/SetupFlow";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { useGame } from "@/context/GameContext";
import type { Preset } from "@/lib/presets";

export function PlayScreen() {
  const { state, inGame, playAgain, resetGame } = useGame();
  const [setup, setSetup] = useState<{ initial: Preset; startStep: 1 | 2 } | null>(null);

  // Once a game starts, coming back to this tab should land on home, not the wizard
  useEffect(() => {
    if (inGame) setSetup(null);
  }, [inGame]);

  /** The last game's players and settings, so a new game starts prefilled */
  const lastSetup = (): Preset => ({
    name: "",
    players: state.players,
    sober: state.sober ?? [],
    genders: state.genders,
    likes: state.likes ?? [],
    relationships: state.relationships ?? [],
    enabledExtensions: state.enabledExtensions.length ? state.enabledExtensions : ["ORIGINAL"],
    cardsPerTurn: state.cardsPerTurn,
    maxRounds: state.maxRounds,
    genderMatch: state.genderMatch,
    randomOrder: false,
  });

  const view = inGame && state.phase === "playing" ? "board" : inGame && state.phase === "finished" ? "over" : setup ? "setup" : "home";

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, x: view === "home" ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
    >
      {view === "home" && (
        <PlayHome
          onNewGame={() => setSetup({ initial: lastSetup(), startStep: 1 })}
          onLoadPreset={(preset) => setSetup({ initial: preset, startStep: 2 })}
        />
      )}
      {view === "setup" && setup && <SetupFlow initial={setup.initial} startStep={setup.startStep} onExit={() => setSetup(null)} />}
      {view === "board" && <GameBoard />}
      {view === "over" && (
        <GameOver
          state={state}
          onPlayAgain={playAgain}
          onBackToSetup={() => {
            const previous = lastSetup();
            resetGame();
            setSetup({ initial: previous, startStep: 1 });
          }}
        />
      )}
    </motion.div>
  );
}
