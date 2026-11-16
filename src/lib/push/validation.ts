import type { TPushSubscriptionInput } from "./types";

export const MAX_ENDPOINT_LENGTH = 2048;
/** Clé publique P-256 non compressée (65 octets) en base64url sans remplissage. */
export const P256DH_LENGTH = 87;
/** Secret d'authentification (16 octets) en base64url sans remplissage. */
export const AUTH_LENGTH = 22;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Services de notification push connus. Le serveur POSTe vers l'endpoint stocké :
 * n'accepter que ces domaines évite qu'un utilisateur ne fasse requêter une URL arbitraire (SSRF).
 */
export const PUSH_SERVICE_DOMAINS = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

/**
 * Vrai si l'endpoint est une URL https sans identifiants ni port, dont le nom d'hôte est
 * un service push connu (domaine exact ou sous-domaine, frontière sur le point).
 * Les adresses IP sont refusées par construction.
 * L'entrée doit aussi être déjà sous forme canonique (`new URL(x).href === x`) : la chaîne
 * stockée puis envoyée à `web-push` est exactement celle validée, donc aucun autre analyseur
 * d'URL (ex. `url.parse` de Node) ne peut en lire l'hôte différemment.
 */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.href !== endpoint) return false;
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") {
    return false;
  }
  const host = url.hostname.toLowerCase();
  return PUSH_SERVICE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
}

/** Valide un endpoint push : longueur bornée et service push connu (voir `isAllowedPushEndpoint`). */
function parseEndpoint(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ENDPOINT_LENGTH) return null;
  return isAllowedPushEndpoint(value) ? value : null;
}

/** Valide une clé de chiffrement : base64url de la longueur exacte attendue. */
function parseKey(value: unknown, length: number): string | null {
  if (typeof value !== "string" || value.length !== length) return null;
  return BASE64URL.test(value) ? value : null;
}

/** Valide le corps `PushSubscription.toJSON()` (`{ endpoint, keys: { p256dh, auth } }`). */
export function parsePushSubscriptionInput(body: unknown): TPushSubscriptionInput | null {
  if (!isRecord(body) || !isRecord(body.keys)) return null;
  const endpoint = parseEndpoint(body.endpoint);
  const p256dh = parseKey(body.keys.p256dh, P256DH_LENGTH);
  const auth = parseKey(body.keys.auth, AUTH_LENGTH);
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

/** Valide le corps `{ endpoint }` d'une demande de désabonnement. */
export function parsePushEndpoint(body: unknown): string | null {
  if (!isRecord(body)) return null;
  return parseEndpoint(body.endpoint);
}
