import type { Card } from "@/data/cards";
import { tokensIn } from "@/lib/tokens";
import { involvesDrinking } from "@/data/forfeits";

/** "x" is neutral */
export type Gender = "m" | "f" | "x";
/** Who someone is into: null means not set (open to anyone), [] means no one */
export type Likes = ("m" | "f")[] | null;
/**
 * null: single or not set. "away": in a relationship with someone who isn't
 * playing. A number: in a relationship with that player.
 */
export type Relationship = null | "away" | number;

export interface TargetContext {
  players: string[];
  /** Players who don't drink */
  sober?: boolean[];
  genders: (Gender | null)[];
  likes: Likes[];
  relationships: Relationship[];
  /** How often each player has already been named by a played card */
  targetCounts: number[];
  /** The player whose turn it is; never targeted */
  currentPlayerIndex: number;
  /** Whether who-likes-who (and relationships) shape the picks */
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

const isTaken = (rel: Relationship | undefined) => rel !== null && rel !== undefined;

/**
 * Whether spicy cards can be dealt to this player: always, unless they're
 * taken and their partner isn't at the table to be the one they're with.
 */
export function canGetSpicy(player: number, relationships: Relationship[], genderMatch: boolean): boolean {
  return !genderMatch || relationships[player] !== "away";
}

/**
 * The player to fill a "someone they're into" slot for `of`:
 * - a partner at the table always comes first;
 * - spicy cards never name anyone who's taken;
 * - someone taken whose partner isn't here gets paired with a person they
 *   wouldn't usually be into, so mild cards stay harmless;
 * - otherwise someone mutually interested, then someone `of` is into, then anyone.
 */
function pickMatch(of: number, pool: number[], ctx: TargetContext, spicy: boolean): number {
  if (!ctx.genderMatch) return pickWeighted(pool, ctx.targetCounts);
  const { genders, likes, relationships } = ctx;

  const partner = relationships[of];
  if (typeof partner === "number" && pool.includes(partner)) return partner;

  const allowed = spicy ? pool.filter((j) => !isTaken(relationships[j])) : pool;
  const candidates = allowed.length ? allowed : pool;

  if (partner === "away") {
    const notInto = candidates.filter((j) => !isInto(of, j, genders, likes));
    return pickWeighted(notInto.length ? notInto : candidates, ctx.targetCounts);
  }

  const mutual = candidates.filter((j) => isInto(of, j, genders, likes) && isInto(j, of, genders, likes));
  if (mutual.length) return pickWeighted(mutual, ctx.targetCounts);
  const oneWay = candidates.filter((j) => isInto(of, j, genders, likes));
  if (oneWay.length) return pickWeighted(oneWay, ctx.targetCounts);
  return pickWeighted(candidates, ctx.targetCounts);
}

/** Fills the card's player slots, each with a different player while possible */
export function personalizeCard(card: Card, ctx: TargetContext): Card {
  const slots = tokensIn(card.rule);
  if (!slots.length) return card;

  const others = ctx.players.map((_, i) => i).filter((i) => i !== ctx.currentPlayerIndex);
  if (!others.length) return card;

  const spicy = !!card.spicy;
  const drinking = involvesDrinking(card.rule);
  const targets: number[] = [];
  for (const slot of slots) {
    const unused = others.filter((i) => !targets.includes(i));
    const pool = unused.length ? unused : others;
    if (slot === "match") {
      targets.push(pickMatch(ctx.currentPlayerIndex, pool, ctx, spicy));
    } else {
      // On spicy cards, random slots also stay away from taken players, and
      // on drinking cards they prefer people who drink
      let safe = spicy && ctx.genderMatch ? pool.filter((j) => !isTaken(ctx.relationships[j])) : pool;
      if (drinking) {
        const drinkers = safe.filter((j) => !ctx.sober?.[j]);
        if (drinkers.length) safe = drinkers;
      }
      targets.push(pickWeighted(safe.length ? safe : pool, ctx.targetCounts));
    }
  }
  return { ...card, targets };
}
