import { Fragment, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { translate, type StringKey } from "./strings";

export function useT() {
  const { settings } = useGame();
  const lang = settings.language;
  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  return { t, lang };
}

/** Renders `**bold**` segments of a translated string */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
