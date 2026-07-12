import { motion, AnimatePresence } from "framer-motion";
import { PlayerSetup } from "@/components/PlayerSetup";
import { GameBoard } from "@/components/GameBoard";
import { useGame } from "@/context/GameContext";
import { tapFeedback } from "@/lib/native";

export function PlayScreen() {
  const { state, startGame, pickCard, skipCards, resetGame, settings } = useGame();
  const feedback = () => {
    if (settings.haptics) tapFeedback();
  };

  return (
    <AnimatePresence mode="wait">
      {state.phase === "setup" ? (
        <motion.div
          key="setup"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
        >
          <PlayerSetup
            onStart={(players, extensions, customCards, cardsPerTurn) => {
              feedback();
              startGame(players, extensions, customCards, cardsPerTurn);
            }}
            initialPlayers={state.players}
            initialExtensions={state.enabledExtensions}
            initialCardsPerTurn={state.cardsPerTurn}
          />
        </motion.div>
      ) : (
        <motion.div
          key="board"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.18 }}
        >
          <GameBoard
            state={state}
            onPickCard={(i) => {
              feedback();
              pickCard(i);
            }}
            onSkip={() => {
              feedback();
              skipCards();
            }}
            onReset={resetGame}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
