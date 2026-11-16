/**
 * Page à ouvrir après un toucher sur une notification push.
 *
 * Le service worker (`public/sw.js`) l'enregistre dans le Cache Storage avant de
 * mettre l'app au premier plan, puis prévient la page par un message. L'app la lit
 * ensuite elle-même et navigue : sur iPhone, `WindowClient.navigate()` échoue quand
 * l'app est suspendue, et `clients.openWindow(url)` ouvre parfois l'accueil au lieu
 * de `url`. Les noms ci-dessous doivent rester identiques à ceux de `public/sw.js`.
 */
export const NOTIFICATION_TARGET_CACHE = "mywatchlist-notification-target";
export const NOTIFICATION_TARGET_KEY = "/__notification-target";
export const NOTIFICATION_TARGET_MESSAGE = "notification-target";

/** Au-delà, la cible est ignorée : une ouverture normale de l'app ne doit pas être détournée. */
export const NOTIFICATION_TARGET_MAX_AGE_MS = 5 * 60 * 1000;
/** Tolérance d'horloge pour une cible datée légèrement dans le futur. */
const CLOCK_SKEW_MS = 60 * 1000;

/** Chemin interne à l'app (jamais d'URL externe ni protocole-relative). */
export function isInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

/** Cible enregistrée `{ url, at }` → chemin à ouvrir, ou null si absente, illisible, externe ou périmée. */
export function parseNotificationTarget(raw: string | null, now: number): string | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const { url, at } = data as Record<string, unknown>;
  if (typeof url !== "string" || !isInternalPath(url)) return null;
  if (typeof at !== "number" || !Number.isFinite(at)) return null;
  const age = now - at;
  if (age > NOTIFICATION_TARGET_MAX_AGE_MS || age < -CLOCK_SKEW_MS) return null;
  return url;
}

/**
 * Lit et efface la cible enregistrée par le service worker. Ne lève jamais : sans
 * Cache Storage (navigateur ancien, rendu serveur), renvoie null.
 */
export async function consumeNotificationTarget(): Promise<string | null> {
  try {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(NOTIFICATION_TARGET_CACHE);
    const response = await cache.match(NOTIFICATION_TARGET_KEY);
    if (!response) return null;
    await cache.delete(NOTIFICATION_TARGET_KEY);
    return parseNotificationTarget(await response.text(), Date.now());
  } catch {
    return null;
  }
}
