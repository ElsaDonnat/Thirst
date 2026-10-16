import type { Card } from "@/data/cards";
import { CARDS_FR, PACK_DESCRIPTIONS, PACK_LABELS_FR, TYPE_LABELS_FR } from "@/data/cards.fr";
import { fillTokens, withLabels } from "@/lib/tokens";
import type { Lang } from "./strings";

export interface CardText {
  name: string;
  rule: string;
  /** Player names inserted into the rule, for highlighting */
  names: string[];
}

/**
 * A card's name and rule in `lang`. Once dealt, its player slots hold real
 * names; before that (e.g. in the Cards tab) they show as readable labels.
 */
export function cardText(card: Card, lang: Lang, players: string[] = []): CardText {
  // Built-in cards carry an id into the translation table; custom cards are
  // shown exactly as their author wrote them
  const base = lang === "fr" && card.id !== undefined ? CARDS_FR[card.id] ?? card : card;
  const names = (card.targets ?? []).map((i) => players[i]).filter(Boolean);
  const rule = names.length ? fillTokens(base.rule, names, lang) : withLabels(base.rule, lang);
  return { name: base.name, rule, names };
}

export function typeLabel(type: Card["type"], lang: Lang): string {
  return lang === "fr" ? TYPE_LABELS_FR[type] ?? type : type;
}

export function packLabel(pack: string, lang: Lang): string {
  return lang === "fr" ? PACK_LABELS_FR[pack] ?? pack : pack;
}

export function packDescription(pack: string, lang: Lang): string {
  return PACK_DESCRIPTIONS[pack]?.[lang] ?? "";
}
