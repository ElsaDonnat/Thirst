import { useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import { toast } from "sonner";
import { useGameState } from "@/hooks/useGameState";
import { PlayerSetup } from "@/components/PlayerSetup";
import { GameBoard } from "@/components/GameBoard";
import { isNative, tapFeedback } from "@/lib/native";

const Index = () => {
  const { state, startGame, pickCard, skipCards, resetGame } = useGameState();

  // Android hardware back: minimize on setup, double-press to leave a running game
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;
  const resetRef = useRef(resetGame);
  resetRef.current = resetGame;
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!isNative) return;
    const listener = CapApp.addListener("backButton", () => {
      if (phaseRef.current === "playing") {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          resetRef.current();
        } else {
          lastBackPress.current = now;
          toast("Press back again to end the game");
        }
      } else {
        CapApp.minimizeApp();
      }
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  if (state.phase === "setup") {
    return (
      <PlayerSetup
        onStart={startGame}
        initialPlayers={state.players}
        initialExtensions={state.enabledExtensions}
        initialCustomCards={state.customCards}
        initialCardsPerTurn={state.cardsPerTurn}
      />
    );
  }

  return (
    <GameBoard
      state={state}
      onPickCard={(i) => {
        tapFeedback();
        pickCard(i);
      }}
      onSkip={() => {
        tapFeedback();
        skipCards();
      }}
      onReset={resetGame}
    />
  );
};

export default Index;
