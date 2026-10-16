import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const DURATION_MS = 1500;

function Mug({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 64 80" className="h-28 w-24" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path d="M46 30 h5 a7 7 0 0 1 7 7 v12 a7 7 0 0 1 -7 7 h-5" fill="none" stroke="#2B1712" strokeWidth="5" />
      <path d="M8 22 h38 v46 a7 7 0 0 1 -7 7 h-24 a7 7 0 0 1 -7 -7 Z" fill="#F4AE3D" stroke="#2B1712" strokeWidth="3" />
      <circle cx="20" cy="50" r="2.5" fill="#FFE29A" />
      <circle cx="31" cy="60" r="2" fill="#FFE29A" />
      <circle cx="35" cy="42" r="1.8" fill="#FFE29A" />
      <path d="M5 24 a7 7 0 0 1 9 -10 a9 9 0 0 1 15 -3 a8 8 0 0 1 13 3 a7 7 0 0 1 7 10 Z" fill="#FFFAEF" stroke="#2B1712" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

interface CheersProps {
  title: string;
  subtitle: string;
  /** Extra lines, e.g. linked players drinking along */
  details?: string[];
  /** Wait for a tap instead of closing by itself (when there's text to read) */
  hold?: boolean;
  holdHint?: string;
  onDone: () => void;
}

/** Two mugs clink with a little burst, then calls onDone */
export function CheersAnimation({ title, subtitle, details = [], hold = false, holdHint, onDone }: CheersProps) {
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
    if (hold) return;
    // A little longer when there are linked players to read about
    const timer = window.setTimeout(() => finishRef.current(), DURATION_MS + (details.length ? 1200 : 0));
    return () => window.clearTimeout(timer);
  }, [hold, details.length]);

  const clink = { duration: 0.42, ease: [0.3, 1.4, 0.6, 1] as const };

  return (
    <motion.button
      onClick={finish}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-2xl bg-background text-foreground"
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
            className="absolute left-1/2 top-2 h-4 w-1 rounded-full bg-brand"
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
        className="title-retro mt-6 text-6xl"
      >
        {title}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.2 }}
        className="mt-2 px-6 text-center text-lg text-foreground/80"
      >
        {subtitle}
      </motion.p>
      {details.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.12, duration: 0.2 }}
          className="mt-2 px-6 text-center text-base font-semibold text-foreground"
        >
          {line}
        </motion.p>
      ))}
      {hold && holdHint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="mt-8 text-sm uppercase tracking-widest"
        >
          {holdHint}
        </motion.p>
      )}
    </motion.button>
  );
}
