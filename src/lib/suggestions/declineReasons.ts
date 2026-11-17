/** Motifs proposés pour refuser une suggestion, montrés à son auteur. */
export const DECLINE_REASONS = [
  { code: "ALREADY_SEEN", label: "Déjà vu" },
  { code: "NOT_FOR_ME", label: "J'aime pas" },
  { code: "NOT_NOW", label: "Pas envie pour l'instant" },
  { code: "NOT_AVAILABLE", label: "Pas sur mes plateformes" },
] as const;

export type TDeclineReason = (typeof DECLINE_REASONS)[number]["code"];

/** Motif reçu (corps de requête, base) → code connu, ou null. */
export function parseDeclineReason(value: unknown): TDeclineReason | null {
  return DECLINE_REASONS.find((reason) => reason.code === value)?.code ?? null;
}

/** Libellé d'un motif ; null pour un motif inconnu ou absent. */
export function declineReasonLabel(value: unknown): string | null {
  return DECLINE_REASONS.find((reason) => reason.code === value)?.label ?? null;
}
