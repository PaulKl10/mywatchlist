/** Réactions possibles à un événement du fil d'activité (une par ami). */
export const REACTIONS = ["LIKE", "LAUGH", "DISLIKE"] as const;

export type TReaction = (typeof REACTIONS)[number];
export type TReactionCounts = Record<TReaction, number>;

/**
 * Types de notification d'une réaction. ACTIVITY_LIKED : « J'aime » enregistrés avant les
 * réactions, sans colonne `reaction` (purgés au bout de 30 jours).
 */
export const REACTION_NOTIFICATION_TYPES = ["ACTIVITY_REACTION", "ACTIVITY_LIKED"];

/** Réaction reçue (corps de requête) → réaction connue, ou null. */
export function parseReaction(value: unknown): TReaction | null {
  return REACTIONS.find((reaction) => reaction === value) ?? null;
}

/** Réaction enregistrée ; une valeur absente ou inconnue (ancien « J'aime ») vaut LIKE. */
export function storedReaction(value: unknown): TReaction {
  return parseReaction(value) ?? "LIKE";
}

export function emptyReactionCounts(): TReactionCounts {
  return { LIKE: 0, LAUGH: 0, DISLIKE: 0 };
}

/** Compte les réactions enregistrées par type. */
export function countReactions(kinds: readonly unknown[]): TReactionCounts {
  const counts = emptyReactionCounts();
  for (const kind of kinds) counts[storedReaction(kind)] += 1;
  return counts;
}

/** Compteurs après qu'une personne passe de la réaction `from` à `to` (null : aucune). */
export function applyReactionChange(
  counts: TReactionCounts,
  from: TReaction | null,
  to: TReaction | null
): TReactionCounts {
  if (from === to) return counts;
  const next = { ...counts };
  if (from) next[from] = Math.max(0, next[from] - 1);
  if (to) next[to] += 1;
  return next;
}
