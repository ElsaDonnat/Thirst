import { motion } from "framer-motion";
import mascotUrl from "@/assets/mascot.webp";

/** The Thirst mascot, a beer bottle raising a pint. `bob` adds a slow idle sway. */
export function Mascot({ className, bob = false }: { className?: string; bob?: boolean }) {
  return (
    <motion.img
      src={mascotUrl}
      alt=""
      draggable={false}
      className={`select-none object-contain ${className ?? ""}`}
      animate={bob ? { y: [0, -6, 0], rotate: [0, -1.5, 0] } : undefined}
      transition={bob ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
  );
}
