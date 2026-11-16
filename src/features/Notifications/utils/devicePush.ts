import {
  getPushUiState,
  isIosUserAgent,
  isSameApplicationServerKey,
  urlBase64ToUint8Array,
  type TPushUiState,
} from "./pushSupport";
import { removePushSubscription } from "../services/push-subscriptions.service";

// Jamais `navigator.serviceWorker.ready` : il ne se résout pas en dev,
// où le service worker n'est pas enregistré.
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!("serviceWorker" in navigator)) return null;
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/** Lit l'état de l'appareil. Ne lève jamais. */
export async function readDevicePush(): Promise<{
  state: TPushUiState;
  subscription: PushSubscription | null;
}> {
  try {
    const hasPushApi =
      "PushManager" in window && "Notification" in window && "serviceWorker" in navigator;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const registration = await getRegistration();
    let subscription: PushSubscription | null = null;
    if (registration && hasPushApi) {
      try {
        subscription = await registration.pushManager.getSubscription();
      } catch {
        subscription = null;
      }
      // Abonnement créé avec une autre clé VAPID : il ne recevrait plus rien. On le purge
      // et on l'affiche comme désactivé, sans réabonnement silencieux.
      if (
        subscription &&
        !isSameApplicationServerKey(
          subscription.options?.applicationServerKey,
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        )
      ) {
        await dropSubscription(subscription);
        subscription = null;
      }
    }
    const state = getPushUiState({
      hasPushApi,
      isIos: isIosUserAgent(navigator.userAgent, navigator.maxTouchPoints),
      isStandalone,
      hasServiceWorker: registration !== null,
      permission: typeof Notification !== "undefined" ? Notification.permission : "default",
      subscribed: subscription !== null,
    });
    return { state, subscription };
  } catch {
    return { state: "unsupported", subscription: null };
  }
}

/** Demande la permission (à appeler dans le geste du clic) puis abonne l'appareil. */
export async function subscribeDevice(): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission_denied");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("missing_vapid_key");

  const registration = await getRegistration();
  if (!registration) throw new Error("no_service_worker");

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

/** Désabonne l'appareil (serveur puis navigateur). Ne lève jamais. */
export async function unsubscribeDevice(): Promise<void> {
  let subscription: PushSubscription | null = null;
  try {
    const registration = await getRegistration();
    subscription = (await registration?.pushManager.getSubscription()) ?? null;
  } catch {
    return;
  }
  if (!subscription) return;
  await dropSubscription(subscription);
}

/**
 * Supprime l'abonnement côté serveur et côté navigateur en parallèle : le navigateur cesse
 * de recevoir les notifications de l'ancien compte même si la requête serveur traîne.
 * Ne lève jamais (le serveur purgera un abonnement mort à l'envoi suivant).
 */
async function dropSubscription(subscription: PushSubscription): Promise<void> {
  const { endpoint } = subscription;
  try {
    await Promise.allSettled([removePushSubscription(endpoint), subscription.unsubscribe()]);
  } catch {
    // Échec synchrone d'un des appels : rien de plus à faire.
  }
}
