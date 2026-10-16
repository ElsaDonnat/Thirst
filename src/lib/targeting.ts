import type { Card } from "@/data/cards";
import { tokensIn } from "@/lib/tokens";

/** "x" is neutral */
export type Gender = "m" | "f" | "x";
/** Who someone is into: null means not set (open to anyone), [] means no one */
export type Likes = ("m" | "f")[] | null;

/**
 * Cards whose wording can name a specific player instead of letting the
 * reader choose. `to` uses {p} (and {p2} for pairs). `flirty` targets follow
 * who-likes-who matching when it's on. The French equivalents live in
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

// Not every eligible built-in card gets a name, so the game keeps some free
// choice. Slots in custom cards are always filled.
const TARGET_CHANCE = 0.5;

export interface TargetContext {
  players: string[];
  genders: (Gender | null)[];
  likes: Likes[];
  /** How often each player has already been named by a played card */
  targetCounts: number[];
  /** The player whose turn it is; never targeted */
  currentPlayerIndex: number;
  /** Whether flirty picks follow who-likes-who */
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

/**
 * Whether `a` could be into `b`. Anything not set counts as a yes, and a
 * neutral or unset gender matches anyone who likes someone.
 */
export function isInto(a: number, b: number, genders: (Gender | null)[], likes: Likes[]): boolean {
  const theirLikes = likes[a] ?? null;
  if (theirLikes === null) return true;
  if (theirLikes.length === 0) return false;
  const g = genders[b] ?? null;
  return g === null || g === "x" || theirLikes.includes(g);
}

/**
 * A flirty partner for `of` from `pool`: someone mutually interested if
 * possible, otherwise someone `of` is into, otherwise anyone.
 */
function pickMatch(of: number, pool: number[], ctx: TargetContext): number {
  if (ctx.genderMatch) {
    const mutual = pool.filter((j) => isInto(of, j, ctx.genders, ctx.likes) && isInto(j, of, ctx.genders, ctx.likes));
    if (mutual.length) return pickWeighted(mutual, ctx.targetCounts);
    const oneWay = pool.filter((j) => isInto(of, j, ctx.genders, ctx.likes));
    if (oneWay.length) return pickWeighted(oneWay, ctx.targetCounts);
  }
  return pickWeighted(pool, ctx.targetCounts);
}

export function personalizeCard(card: Card, ctx: TargetContext): Card {
  const others = ctx.players.map((_, i) => i).filter((i) => i !== ctx.currentPlayerIndex);

  // Custom cards: fill every slot, each with a different player while possible
  const slots = tokensIn(card.rule);
  if (slots.length) {
    if (!others.length) return card;
    const targets: number[] = [];
    for (const slot of slots) {
      const unused = others.filter((i) => !targets.includes(i));
      const pool = unused.length ? unused : others;
      targets.push(slot === "match" ? pickMatch(ctx.currentPlayerIndex, pool, ctx) : pickWeighted(pool, ctx.targetCounts));
    }
    return { ...card, targets };
  }

  const entry = TARGETABLE.find((t) => card.rule.includes(t.from));
  if (!entry || Math.random() > TARGET_CHANCE) return card;
  if (others.length < (entry.pair ? 2 : 1)) return card;

  if (entry.pair) {
    // Two other players paired up: the second is a match for the first
    const first = pickWeighted(others, ctx.targetCounts);
    const rest = others.filter((i) => i !== first);
    const second = entry.flirty ? pickMatch(first, rest, ctx) : pickWeighted(rest, ctx.targetCounts);
    return { ...card, targets: [first, second] };
  }

  const first = entry.flirty ? pickMatch(ctx.currentPlayerIndex, others, ctx) : pickWeighted(others, ctx.targetCounts);
  return { ...card, targets: [first] };
}
