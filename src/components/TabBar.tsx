import { motion } from "framer-motion";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { Dices, Layers, Info } from "lucide-react";
import { useT } from "@/i18n";
import type { StringKey } from "@/i18n/strings";

export type TabId = "play" | "cards" | "info";

const TABS: { id: TabId; label: StringKey; icon: typeof Dices }[] = [
  { id: "play", label: "tabs.play", icon: Dices },
  { id: "cards", label: "tabs.cards", icon: Layers },
  { id: "info", label: "tabs.info", icon: Info },
];

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  const { t } = useT();
  // The webview shrinks above the keyboard, which would lift the bar on top
  // of the inputs; native apps hide it instead
  const keyboardOpen = useKeyboardOpen();

  if (keyboardOpen) return null;

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
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
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
            {t(label)}
          </button>
        ))}
      </div>
    </nav>
  );
}
