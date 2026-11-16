import type { TPushSubscriptionInput } from "./types";

export const MAX_ENDPOINT_LENGTH = 2048;
export const MAX_KEY_LENGTH = 200;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Valide un endpoint push : URL https de longueur bornée. */
function parseEndpoint(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ENDPOINT_LENGTH) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** Valide une clé de chiffrement : base64url non vide de longueur bornée. */
function parseKey(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_KEY_LENGTH) return null;
  return BASE64URL.test(value) ? value : null;
}

/** Valide le corps `PushSubscription.toJSON()` (`{ endpoint, keys: { p256dh, auth } }`). */
export function parsePushSubscriptionInput(body: unknown): TPushSubscriptionInput | null {
  if (!isRecord(body) || !isRecord(body.keys)) return null;
  const endpoint = parseEndpoint(body.endpoint);
  const p256dh = parseKey(body.keys.p256dh);
  const auth = parseKey(body.keys.auth);
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

/** Valide le corps `{ endpoint }` d'une demande de désabonnement. */
export function parsePushEndpoint(body: unknown): string | null {
  if (!isRecord(body)) return null;
  return parseEndpoint(body.endpoint);
}
