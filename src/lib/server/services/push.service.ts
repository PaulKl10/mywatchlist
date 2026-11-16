import { after } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { isGonePushStatus, readVapidConfig } from "@/lib/push/config";
import { buildPushPayload } from "@/lib/push/payload";
import { isAllowedPushEndpoint } from "@/lib/push/validation";
import type {
  TPushEvent,
  TPushPayload,
  TPushSubscriptionInput,
} from "@/lib/push/types";

/** Durée pendant laquelle le service push garde la notification d'un appareil hors ligne (24 h). */
const PUSH_TTL_SECONDS = 86_400;

/** Nombre maximal d'appareils conservés par utilisateur (les plus anciens sont supprimés). */
const MAX_PUSH_SUBSCRIPTIONS_PER_USER = 10;

/** Délai d'attente maximal d'une requête vers le service push (10 s). */
const PUSH_TIMEOUT_MS = 10_000;

let vapidReady: boolean | null = null;

/** Configure web-push une seule fois ; false (et un seul avertissement) sans clés VAPID. */
function ensureVapid(): boolean {
  if (vapidReady !== null) return vapidReady;
  const config = readVapidConfig(process.env);
  if (!config) {
    console.warn("push: clés VAPID absentes, notifications désactivées");
    vapidReady = false;
    return false;
  }
  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  } catch {
    // Clés mal formées : même effet que des clés absentes, sans rien journaliser d'autre.
    console.warn("Notifications push désactivées : clés VAPID invalides.");
    vapidReady = false;
    return false;
  }
  vapidReady = true;
  return true;
}

/** Enregistre l'appareil ; un même `endpoint` repasse sur l'utilisateur courant. */
export async function savePushSubscription(
  userId: string,
  input: TPushSubscriptionInput
): Promise<void> {
  const { endpoint, p256dh, auth } = input;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });
  // Borne le nombre d'appareils : on supprime les plus anciens au-delà des plus récents.
  const stale = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: MAX_PUSH_SUBSCRIPTIONS_PER_USER,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: stale.map((s) => s.id) } },
    });
  }
}

/** Supprime l'abonnement s'il appartient à l'utilisateur (sans erreur s'il n'existe pas). */
export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

/** Envoie à tous les appareils de l'utilisateur ; ne lève jamais (journalise les codes seuls). */
async function sendPushToUser(userId: string, payload: TPushPayload): Promise<void> {
  try {
    if (!ensureVapid()) return;
    const stored = await prisma.pushSubscription.findMany({ where: { userId } });
    // Défense en profondeur (SSRF) : on n'envoie qu'aux services push connus ; les autres
    // endpoints stockés sont supprimés comme des abonnements disparus, sans journaliser l'URL.
    const subscriptions = stored.filter((s) => isAllowedPushEndpoint(s.endpoint));
    const rejected = stored.filter((s) => !isAllowedPushEndpoint(s.endpoint));
    if (rejected.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: rejected.map((s) => s.id) } },
      });
    }
    const body = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subscriptions.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          // Notifications rares, visibles et sensibles au temps : l'urgence « high » les fait
          // réveiller un téléphone Android inactif (FCM traite toute autre urgence en priorité
          // normale, retardée en mode Doze). Le délai d'attente évite que `after()` ne reste
          // bloqué sur un service push qui ne répond pas.
          { TTL: PUSH_TTL_SECONDS, urgency: "high", timeout: PUSH_TIMEOUT_MS }
        )
      )
    );
    await Promise.all(
      results.map(async (result, index) => {
        if (result.status === "fulfilled") return;
        const status = (result.reason as { statusCode?: number } | null)?.statusCode;
        if (isGonePushStatus(status)) {
          // Abonnement expiré ou révoqué : on l'oublie.
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscriptions[index].endpoint },
          });
        } else {
          console.error("push: échec d'envoi, statut", status);
        }
      })
    );
  } catch {
    console.error("push: erreur inattendue pendant l'envoi");
  }
}

/** Envoie tout de suite (tâche planifiée, hors requête d'un utilisateur). Ne lève jamais. */
export async function sendPushNotification(userId: string, event: TPushEvent): Promise<void> {
  await sendPushToUser(userId, buildPushPayload(event));
}

/** Planifie l'envoi après la réponse. À appeler depuis un Route Handler uniquement. */
export function schedulePushNotification(userId: string, event: TPushEvent): void {
  after(() => sendPushToUser(userId, buildPushPayload(event)));
}
