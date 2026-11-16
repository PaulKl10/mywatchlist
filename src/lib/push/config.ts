export type TVapidConfig = { publicKey: string; privateKey: string; subject: string };

/** Lit la configuration VAPID ; null si incomplète ou si le sujet n'est ni `mailto:` ni `https://`. */
export function readVapidConfig(env: Record<string, string | undefined>): TVapidConfig | null {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) return null;
  return { publicKey, privateKey, subject };
}

/** Vrai si le service push indique que l'abonnement n'existe plus (404 ou 410). */
export function isGonePushStatus(status: number | undefined): boolean {
  return status === 404 || status === 410;
}
