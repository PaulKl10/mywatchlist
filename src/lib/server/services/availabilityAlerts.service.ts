import { prisma } from "@/lib/prisma";
import { tmdbErrorMessage } from "@/lib/tmdb-client";
import {
  newProviderIds,
  planAvailabilityAlerts,
  type TAvailabilityChange,
} from "@/lib/availability/alerts";
import type { TPushEvent } from "@/lib/push/types";
import type { TMediaType } from "@/types/movie.type";
import { fetchFrenchStreamingProviders } from "./movieNightDeck.service";
import { sendPushNotification } from "./push.service";
import { fetchFrenchFlatrateIds } from "./watchProviders.service";

/** Titres vérifiés au plus par passage (les jamais vérifiés, puis les plus anciens d'abord). */
const MAX_TITLES_PER_RUN = 300;
/** Fiches de plateformes demandées en parallèle à TMDB. */
const CONCURRENCY = 10;
/** Un relevé non rafraîchi depuis (titre sorti de toutes les watchlists) est supprimé. */
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type TAvailabilityRunSummary = {
  checked: number;
  failed: number;
  changed: number;
  alertedUsers: number;
};

const keyOf = (mediaType: string, tmdbId: number) => `${mediaType}:${tmdbId}`;
const asMediaType = (value: string): TMediaType => (value === "tv" ? "tv" : "movie");

/** Noms des plateformes ; une alerte reste envoyée (avec un nom générique) si TMDB échoue. */
async function loadProviderNames(): Promise<Map<number, string>> {
  try {
    return new Map((await fetchFrenchStreamingProviders()).map((p) => [p.id, p.name]));
  } catch (error) {
    console.error("[availability] Noms des plateformes illisibles", tmdbErrorMessage(error));
    return new Map();
  }
}

/**
 * Passage quotidien de l'alerte « enfin dispo » : relève les plateformes des titres des
 * watchlists, puis prévient chaque utilisateur dont un titre vient d'arriver sur une de ses
 * plateformes. Le premier relevé d'un titre sert de référence et ne prévient personne.
 */
export async function runAvailabilityCheck(now: Date = new Date()): Promise<TAvailabilityRunSummary> {
  const [titles, rows] = await Promise.all([
    prisma.watchlistItem.findMany({
      distinct: ["media_type", "tmdb_movie_id"],
      select: { media_type: true, tmdb_movie_id: true },
    }),
    prisma.titleAvailability.findMany(),
  ]);
  const rowByKey = new Map(rows.map((row) => [keyOf(row.media_type, row.tmdb_id), row]));
  const queue = titles
    .map((t) => ({
      mediaType: asMediaType(t.media_type),
      tmdbId: t.tmdb_movie_id,
      row: rowByKey.get(keyOf(t.media_type, t.tmdb_movie_id)) ?? null,
    }))
    .sort((a, b) => (a.row?.checked_at.getTime() ?? 0) - (b.row?.checked_at.getTime() ?? 0))
    .slice(0, MAX_TITLES_PER_RUN);

  const changes: TAvailabilityChange[] = [];
  let checked = 0;
  let failed = 0;
  for (let start = 0; start < queue.length; start += CONCURRENCY) {
    const batch = queue.slice(start, start + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((t) => fetchFrenchFlatrateIds(t.mediaType, t.tmdbId))
    );
    const upserts = settled.flatMap((result, i) => {
      const { mediaType, tmdbId, row } = batch[i];
      if (result.status === "rejected") {
        failed += 1;
        return [];
      }
      checked += 1;
      const arrived = newProviderIds(row?.provider_ids ?? null, result.value);
      if (arrived.length > 0) changes.push({ mediaType, tmdbId, newProviderIds: arrived });
      return [
        prisma.titleAvailability.upsert({
          where: { media_type_tmdb_id: { media_type: mediaType, tmdb_id: tmdbId } },
          create: { media_type: mediaType, tmdb_id: tmdbId, provider_ids: result.value, checked_at: now },
          update: { provider_ids: result.value, checked_at: now },
        }),
      ];
    });
    if (upserts.length > 0) await prisma.$transaction(upserts);
  }
  if (failed > 0) console.error(`[availability] ${failed} titre(s) illisible(s) sur TMDB`);

  let alertedUsers = 0;
  if (changes.length > 0) {
    const [watchers, providerNames] = await Promise.all([
      prisma.watchlistItem.findMany({
        where: {
          OR: changes.map((c) => ({ media_type: c.mediaType, tmdb_movie_id: c.tmdbId })),
          user: { streaming_provider_ids: { isEmpty: false } },
        },
        select: {
          userId: true,
          media_type: true,
          tmdb_movie_id: true,
          title: true,
          user: { select: { streaming_provider_ids: true } },
        },
      }),
      loadProviderNames(),
    ]);
    const alerts = planAvailabilityAlerts(
      changes,
      watchers.map((w) => ({
        userId: w.userId,
        providerIds: w.user.streaming_provider_ids,
        mediaType: asMediaType(w.media_type),
        tmdbId: w.tmdb_movie_id,
        title: w.title,
      })),
      providerNames
    );
    for (const [userId, list] of alerts) {
      const event: TPushEvent =
        list.length === 1
          ? { type: "now_available", ...list[0] }
          : {
              type: "now_available_many",
              count: list.length,
              providerNames: [...new Set(list.map((a) => a.providerName))],
            };
      await sendPushNotification(userId, event);
      alertedUsers += 1;
    }
  }

  await prisma.titleAvailability.deleteMany({
    where: { checked_at: { lt: new Date(now.getTime() - STALE_AFTER_MS) } },
  });

  return { checked, failed, changed: changes.length, alertedUsers };
}
