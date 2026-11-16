export type TPushUiState =
  | "unsupported"
  | "needs_install"
  | "no_service_worker"
  | "denied"
  | "off"
  | "on";

/** Décode une clé publique VAPID (base64url) pour `applicationServerKey`. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const standard = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(standard);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** iPhone/iPad/iPod, ou « Macintosh » avec écran tactile (iPadOS se présente comme un Mac). */
export function isIosUserAgent(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 0;
}

export function getPushUiState(input: {
  hasPushApi: boolean;
  isIos: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}): TPushUiState {
  // Sur iOS, Web Push n'existe que dans l'app installée : on propose l'installation.
  if (input.isIos && !input.isStandalone) return "needs_install";
  if (!input.hasPushApi) return "unsupported";
  if (!input.hasServiceWorker) return "no_service_worker";
  if (input.permission === "denied") return "denied";
  return input.subscribed ? "on" : "off";
}
