import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { App as CapApp } from "@capacitor/app";
import { TabBar, type TabId } from "@/components/TabBar";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { PlayScreen } from "@/screens/PlayScreen";
import { CardsScreen } from "@/screens/CardsScreen";
import { InfoScreen } from "@/screens/InfoScreen";
import { useGame } from "@/context/GameContext";
import { isNative, runBackHandler } from "@/lib/native";

const Index = () => {
  const [tab, setTab] = useState<TabId>("play");
  const { inGame, leaveGame } = useGame();

  // Android hardware back: other tabs go to the Play tab; in a game it goes
  // back to the setup page (the game stays saved there); on setup it minimizes
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const inGameRef = useRef(inGame);
  inGameRef.current = inGame;
  const leaveRef = useRef(leaveGame);
  leaveRef.current = leaveGame;

  useEffect(() => {
    if (!isNative) return;
    const listener = CapApp.addListener("backButton", () => {
      if (runBackHandler()) return;
      if (tabRef.current !== "play") {
        setTab("play");
      } else if (inGameRef.current) {
        leaveRef.current();
      } else {
        CapApp.minimizeApp();
      }
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  return (
    <div>
      <WelcomeDialog />
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === "play" ? <PlayScreen /> : tab === "cards" ? <CardsScreen /> : <InfoScreen />}
      </motion.div>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
};

export default Index;
