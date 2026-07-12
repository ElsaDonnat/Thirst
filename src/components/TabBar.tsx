import { motion } from "framer-motion";
import { Dices, Layers, Info } from "lucide-react";

export type TabId = "play" | "cards" | "info";

const TABS: { id: TabId; label: string; icon: typeof Dices }[] = [
  { id: "play", label: "Play", icon: Dices },
  { id: "cards", label: "Cards", icon: Layers },
  { id: "info", label: "Info", icon: Info },
];

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
              tab === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab === id && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                transition={{ duration: 0.2 }}
              />
            )}
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
