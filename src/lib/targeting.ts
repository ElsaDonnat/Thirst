import type { Card } from "@/data/cards";

/** "x" is neutral; neutral and unset players can be picked by anyone */
export type Gender = "m" | "f" | "x";

/**
 * Cards whose wording can name a specific player instead of letting the
 * reader choose. `to` uses {p} (and {p2} for pairs). `flirty` targets follow
 * the optional gender matching. The French equivalents live in
 * TARGETABLE_FR, keyed by `from`.
 */
export const TARGETABLE: { from: string; to: string; flirty?: boolean; pair?: boolean }[] = [
  { from: "Choose another player to be your mate.", to: "{p} is your mate." },
  { from: "Choose a player who surfs on you.", to: "{p} surfs on you." },
  { from: "Eat something another player chewed.", to: "Eat something {p} chewed." },
  { from: "Let another player spit water on your face.", to: "Let {p} spit water on your face." },
  { from: "Tails: Choose a player who drinks a shot.", to: "Tails: {p} drinks a shot." },
  { from: "Choose a player who will drink every time you do.", to: "{p} will drink every time you do." },
  { from: "Give 3 dares to the player of your choice.", to: "Give 3 dares to {p}." },
  { from: "Give a dare to the player of your choice.", to: "Give a dare to {p}." },
  { from: "Ask a player of your choice a question", to: "Ask {p} a question" },
  { from: "Do a mating dance to a random player.", to: "Do a mating dance for {p}.", flirty: true },
  { from: "Choose a player who will call you \"master\"", to: "{p} will call you \"master\"", flirty: true },
  { from: "Rub the shoulders of a player of your choosing", to: "Rub the shoulders of {p}", flirty: true },
  { from: "Choose two players who will hold hands for a full round.", to: "{p} and {p2} will hold hands for a full round.", flirty: true, pair: true },
  { from: "Choose two players who will dance for your own pleasure.", to: "{p} and {p2} will dance for your own pleasure.", flirty: true, pair: true },
];

// Not every eligible card gets a name, so the game keeps some free choice
const TARGET_CHANCE = 0.5;

export interface TargetContext {
  players: string[];
  genders: (Gender | null)[];
  /** How often each player has already been named by a played card */
  targetCounts: number[];
  /** The player whose turn it is; never targeted */
  currentPlayerIndex: number;
  genderMatch: boolean;
}

/**
 * Weighted pick that favours players who have been named less often, so the
 * same person isn't picked on all game.
 */
function pickWeighted(candidates: number[], counts: number[]): number {
  const weights = candidates.map((i) => 1 / (1 + (counts[i] ?? 0)) ** 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let k = 0; k < candidates.length; k++) {
    r -= weights[k];
    if (r <= 0) return candidates[k];
  }
  return candidates[candidates.length - 1];
}

/** Players of the opposite gender to `of`; empty unless `of` is a man or a woman */
function oppositeOf(of: number, pool: number[], genders: (Gender | null)[]): number[] {
  const g = genders[of];
  if (g !== "m" && g !== "f") return [];
  const opposite = g === "m" ? "f" : "m";
  return pool.filter((i) => genders[i] === opposite);
}

export function personalizeCard(card: Card, ctx: TargetContext): Card {
  const entry = TARGETABLE.find((t) => card.rule.includes(t.from));
  if (!entry || Math.random() > TARGET_CHANCE) return card;

  const others = ctx.players.map((_, i) => i).filter((i) => i !== ctx.currentPlayerIndex);
  if (others.length < (entry.pair ? 2 : 1)) return card;

  const matching = entry.flirty && ctx.genderMatch;
  let first: number;
  let second: number | null = null;

  if (entry.pair) {
    first = pickWeighted(others, ctx.targetCounts);
    const rest = others.filter((i) => i !== first);
    const preferred = matching ? oppositeOf(first, rest, ctx.genders) : [];
    second = pickWeighted(preferred.length ? preferred : rest, ctx.targetCounts);
  } else {
    const preferred = matching ? oppositeOf(ctx.currentPlayerIndex, others, ctx.genders) : [];
    first = pickWeighted(preferred.length ? preferred : others, ctx.targetCounts);
  }

  return { ...card, targets: second === null ? [first] : [first, second] };
}
