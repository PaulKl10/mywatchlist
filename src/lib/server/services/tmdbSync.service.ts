import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";
import { NOTIFICATION_MAX_AGE_MS } from "@/lib/notifications/items";
import { ACTIVITY_MAX_AGE_MS } from "./activity.service";
import { resyncRatings } from "./ratings.service";
import type { TCurrentSession } from "./session.service";
import { resyncWatchlist } from "./watchlist.service";

/** Resynchro complète des copies au plus une fois par heure et par utilisateur. */
const RESYNC_INTERVAL_MS = 60 * 60 * 1000;
/**
 * Âge maximal des données TMDB copiées : TMDB interdit de les garder plus de 6 mois. Les
 * copies d'un utilisateur absent depuis plus longtemps sont supprimées, et recréées à son retour.
 */
const COPY_MAX_AGE_MS = 150 * 24 * 60 * 60 * 1000;

/**
 * Recopie la watchlist et les notes TMDB en base. `watchlist_synced_at` (date de la dernière
 * resynchro réussie des deux copies) sert de verrou : une seule resynchro à la fois par
 * utilisateur, même avec plusieurs onglets. Une copie jamais resynchronisée est un import
 * initial : rien n'entre dans le fil d'activité, et les notes importées n'ont pas de date.
 */
async function syncTmdbCopies(session: TCurrentSession): Promise<void> {
  const { user } = session;
  const startedAt = new Date();

  const { count } = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [
        { watchlist_synced_at: null },
        { watchlist_synced_at: { lt: new Date(startedAt.getTime() - RESYNC_INTERVAL_MS) } },
      ],
    },
    data: { watchlist_synced_at: startedAt },
  });
  if (count === 0) return;

  const results = await Promise.allSettled([
    resyncWatchlist(session, startedAt, user.watchlist_synced_at === null),
    resyncRatings(session, startedAt, user.ratings_synced_at === null),
  ]);
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failures.length > 0) {
    // Copies pas toutes rafraîchies : la date reprend sa valeur, pour que la prochaine visite
    // réessaie et que la purge des copies trop vieilles reste juste.
    await prisma.user
      .updateMany({
        where: { id: user.id, watchlist_synced_at: startedAt },
        data: { watchlist_synced_at: user.watchlist_synced_at },
      })
      .catch(() => undefined);
    for (const failure of failures) {
      console.error("[tmdb-sync] Resynchro impossible", tmdbErrorMessage(failure.reason));
    }
    return;
  }

  await purgeStaleData(startedAt);
}

/**
 * Supprime les copies dont les données ont plus de COPY_MAX_AGE_MS (utilisateurs sans
 * resynchro depuis, ou jamais resynchronisés : l'âge est alors celui de l'ajout ou de la
 * note), les événements du fil et les notifications enregistrées de plus de 30 jours.
 */
async function purgeStaleData(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - COPY_MAX_AGE_MS);
  const staleUser = { watchlist_synced_at: { lt: cutoff } };
  try {
    await prisma.$transaction([
      prisma.watchlistItem.deleteMany({
        where: {
          OR: [
            { user: staleUser },
            { user: { watchlist_synced_at: null }, added_at: { lt: cutoff } },
          ],
        },
      }),
      prisma.ratingItem.deleteMany({
        where: {
          OR: [
            { user: { ratings_synced_at: { lt: cutoff } } },
            // Notes jamais resynchronisées : seulement des notes datées, données depuis l'app.
            { user: { ratings_synced_at: null }, rated_at: { lt: cutoff } },
          ],
        },
      }),
      prisma.activity.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - ACTIVITY_MAX_AGE_MS) } },
      }),
      prisma.userNotification.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - NOTIFICATION_MAX_AGE_MS) } },
      }),
    ]);
  } catch (error) {
    console.error("[tmdb-sync] Purge des données trop vieilles impossible", tmdbErrorMessage(error));
  }
}

/**
 * Planifie, après la réponse, la resynchro des copies si la dernière date de plus d'une
 * heure. À appeler depuis un Route Handler uniquement.
 */
export function scheduleTmdbSync(session: TCurrentSession): void {
  const lastSync = session.user.watchlist_synced_at;
  if (lastSync && Date.now() - lastSync.getTime() < RESYNC_INTERVAL_MS) return;
  if (!tmdbClient.isConfigured()) return;
  after(async () => {
    try {
      await syncTmdbCopies(session);
    } catch (error) {
      console.error("[tmdb-sync] Resynchro interrompue", tmdbErrorMessage(error));
    }
  });
}
