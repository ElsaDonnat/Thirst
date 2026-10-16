import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const DURATION_MS = 1500;

function Mug({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 64 80" className="h-28 w-24" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path d="M46 30 h5 a7 7 0 0 1 7 7 v12 a7 7 0 0 1 -7 7 h-5" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M8 22 h38 v46 a7 7 0 0 1 -7 7 h-24 a7 7 0 0 1 -7 -7 Z" fill="#F6B533" stroke="#fff" strokeWidth="3.5" />
      <circle cx="20" cy="50" r="2.5" fill="#FFE29A" />
      <circle cx="31" cy="60" r="2" fill="#FFE29A" />
      <circle cx="35" cy="42" r="1.8" fill="#FFE29A" />
      <path d="M5 24 a7 7 0 0 1 9 -10 a9 9 0 0 1 15 -3 a8 8 0 0 1 13 3 a7 7 0 0 1 7 10 Z" fill="#fff" />
    </svg>
  );
}

/** Two mugs clink with a little burst, then calls onDone */
export function CheersAnimation({ title, subtitle, onDone }: { title: string; subtitle: string; onDone: () => void }) {
  // Tapping to skip and the timer can both fire; only the first one counts
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const timer = window.setTimeout(() => finishRef.current(), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const clink = { duration: 0.42, ease: [0.3, 1.4, 0.6, 1] as const };

  return (
    <motion.button
      onClick={finish}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D4FE3] to-[#4527BD] text-white"
    >
      <div className="relative flex items-end">
        <motion.div initial={{ x: -70, rotate: -25 }} animate={{ x: 6, rotate: 14 }} transition={clink} style={{ originX: 0.5, originY: 1 }}>
          <Mug />
        </motion.div>
        <motion.div initial={{ x: 70, rotate: 25 }} animate={{ x: -6, rotate: -14 }} transition={clink} style={{ originX: 0.5, originY: 1 }}>
          <Mug flip />
        </motion.div>
        {/* Sparks at the point of contact */}
        {[-60, -20, 20, 60].map((angle, i) => (
          <motion.span
            key={angle}
            className="absolute left-1/2 top-2 h-4 w-1 rounded-full bg-white"
            style={{ rotate: angle, originY: 2.5 }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 1], y: [0, -10, -18] }}
            transition={{ delay: 0.38 + i * 0.02, duration: 0.45 }}
          />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.42, duration: 0.25, ease: [0.3, 1.5, 0.6, 1] }}
        className="mt-6 font-display text-5xl font-bold"
      >
        {title}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.2 }}
        className="mt-2 px-6 text-center text-lg text-white/85"
      >
        {subtitle}
      </motion.p>
    </motion.button>
  );
}
