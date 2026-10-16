import type { Lang } from "@/i18n/strings";

/** What a sober player does instead of drinking. Social, not physical. */
export const FORFEITS: Record<Lang, string>[] = [
  {
    en: "Give every player a sincere compliment.",
    fr: "Fais un compliment sincère à chaque joueur.",
  },
  {
    en: "Tell the group an embarrassing story they've never heard.",
    fr: "Raconte au groupe une anecdote gênante qu'il n'a jamais entendue.",
  },
  {
    en: "Admit something about yourself that the others probably already suspect.",
    fr: "Avoue un truc sur toi que les autres soupçonnent sûrement déjà.",
  },
  {
    en: "Share your most unpopular opinion and defend it for 30 seconds.",
    fr: "Donne ton avis le plus impopulaire et défends-le pendant 30 secondes.",
  },
  {
    en: "Do an impression of another player until someone guesses who it is.",
    fr: "Imite un autre joueur jusqu'à ce que quelqu'un devine qui c'est.",
  },
  {
    en: "Let the group pick a nickname that everyone calls you until your next turn.",
    fr: "Laisse le groupe te trouver un surnom que tout le monde utilise jusqu'à ton prochain tour.",
  },
  {
    en: "Sing the chorus of a song chosen by the player on your left.",
    fr: "Chante le refrain d'une chanson choisie par le joueur à ta gauche.",
  },
  {
    en: "Answer one question from the group, honestly and in full.",
    fr: "Réponds à une question du groupe, honnêtement et sans esquiver.",
  },
  {
    en: "Talk with a foreign accent until your next turn.",
    fr: "Parle avec un accent étranger jusqu'à ton prochain tour.",
  },
  {
    en: "Describe your last date or your last crush in three sentences.",
    fr: "Décris ton dernier date ou ton dernier crush en trois phrases.",
  },
  {
    en: "Tell everyone the most childish thing you still do.",
    fr: "Dis à tout le monde le truc le plus gamin que tu fais encore.",
  },
  {
    en: "Let the player on your right choose a pose you hold until your next turn.",
    fr: "Laisse le joueur à ta droite choisir une pose que tu gardes jusqu'à ton prochain tour.",
  },
];

/** Whether a card asks someone to drink, so a sober player needs a forfeit */
export function involvesDrinking(rule: string): boolean {
  return /\b(drinks?|drinking|sips?|shots?|chug\w*|gulp|bois|boit|boire|buvez|gorgées?|cul sec)\b/i.test(rule);
}

export function randomForfeit(): number {
  return Math.floor(Math.random() * FORFEITS.length);
}
