import type { Lang } from "@/i18n/strings";

/**
 * Player slots that custom cards can contain. They're stored as {random} and
 * {match} so a card keeps working when the language changes, and shown to
 * the person writing the card as readable labels.
 */
export type TokenKind = "random" | "match";

export const TOKEN_LABELS: Record<TokenKind, Record<Lang, string>> = {
  random: { en: "[random player]", fr: "[joueur au hasard]" },
  match: { en: "[someone they're into]", fr: "[quelqu'un qui lui plaît]" },
};

// Older label still understood when typed into a card
const LEGACY_LABELS: Record<TokenKind, string[]> = { random: [], match: ["[crush]"] };

const STORED = /\{(random|match)\}/g;

/** The slots in a stored rule, in reading order */
export function tokensIn(rule: string): TokenKind[] {
  return [...rule.matchAll(STORED)].map((m) => m[1] as TokenKind);
}

/** Stored rule to the text shown in the editor or on a card */
export function withLabels(rule: string, lang: Lang): string {
  return rule.replace(STORED, (_, kind: TokenKind) => TOKEN_LABELS[kind][lang]);
}

/** Editor text (labels in either language) back to the stored form */
export function fromLabels(text: string): string {
  let out = text;
  for (const kind of Object.keys(TOKEN_LABELS) as TokenKind[]) {
    for (const label of [...Object.values(TOKEN_LABELS[kind]), ...LEGACY_LABELS[kind]]) {
      out = out.split(label).join(`{${kind}}`);
    }
  }
  return out;
}

/** Fills each slot in turn with the matching name */
export function fillTokens(rule: string, names: string[]): string {
  let i = 0;
  return rule.replace(STORED, () => names[i++] ?? "");
}
