import type { Card } from "@/data/cards";
import { CARDS_FR, PACK_DESCRIPTIONS, PACK_LABELS_FR, TARGETABLE_FR, TYPE_LABELS_FR } from "@/data/cards.fr";
import { TARGETABLE } from "@/lib/targeting";
import type { Lang } from "./strings";

export interface CardText {
  name: string;
  rule: string;
  /** Player names inserted into the rule, for highlighting */
  names: string[];
}

/** A card's name and rule in `lang`, with any targeted players filled in */
export function cardText(card: Card, lang: Lang, players: string[] = []): CardText {
  // Built-in cards carry an id into the translation table; custom cards are
  // shown exactly as their author wrote them
  const base = lang === "fr" && card.id !== undefined ? CARDS_FR[card.id] ?? card : card;
  let rule = base.rule;
  const names = (card.targets ?? []).map((i) => players[i]).filter(Boolean);

  if (names.length) {
    const entry = TARGETABLE.find((t) => card.rule.includes(t.from));
    const phrase = entry && (lang === "fr" ? TARGETABLE_FR[entry.from] : entry);
    if (phrase && rule.includes(phrase.from)) {
      rule = rule.replace(phrase.from, phrase.to.replace("{p}", names[0]).replace("{p2}", names[1] ?? ""));
    }
  }
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
