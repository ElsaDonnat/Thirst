import type { Lang } from "@/i18n/strings";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

/** Two-option language toggle; `inverted` is for use on the purple header */
export function LanguageSwitch({ value, onChange, inverted = false }: { value: Lang; onChange: (lang: Lang) => void; inverted?: boolean }) {
  return (
    <div className={`inline-flex rounded-full p-1 ${inverted ? "bg-white/15" : "bg-secondary"}`}>
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? inverted
                  ? "bg-white text-brand"
                  : "bg-primary text-primary-foreground"
                : inverted
                  ? "text-white/80"
                  : "text-muted-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
