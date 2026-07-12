import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { App as CapApp } from "@capacitor/app";
import { toast } from "sonner";
import { TabBar, type TabId } from "@/components/TabBar";
import { PlayScreen } from "@/screens/PlayScreen";
import { CardsScreen } from "@/screens/CardsScreen";
import { InfoScreen } from "@/screens/InfoScreen";
import { useGame } from "@/context/GameContext";
import { isNative } from "@/lib/native";

const Index = () => {
  const [tab, setTab] = useState<TabId>("play");
  const { state, resetGame } = useGame();

  // Android hardware back: other tabs → Play tab; setup → minimize;
  // during a game → double-press to end it
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;
  const resetRef = useRef(resetGame);
  resetRef.current = resetGame;
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!isNative) return;
    const listener = CapApp.addListener("backButton", () => {
      if (tabRef.current !== "play") {
        setTab("play");
        return;
      }
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

  return (
    <div className="pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "play" ? <PlayScreen /> : tab === "cards" ? <CardsScreen /> : <InfoScreen />}
        </motion.div>
      </AnimatePresence>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
