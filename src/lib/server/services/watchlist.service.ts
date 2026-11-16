import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";
import { tmdbClient } from "@/lib/tmdb-client";
import { planWatchlistResync, type TRemoteWatchlistList } from "@/lib/watchlist/resync";
import {
  movieToSnapshot,
  tvToSnapshot,
  type TWatchlistSnapshot,
} from "@/lib/watchlist/snapshot";
import type { TMediaType, TMovie, TWatchlistTv } from "@/types/movie.type";
import { activityData, upsertActivity } from "./activity.service";
import type { TCurrentSession } from "./session.service";
import { fetchAccountList } from "./tmdbAccount.service";

async function fetchWatchlistSnapshot(
  mediaId: number,
  mediaType: TMediaType
): Promise<TWatchlistSnapshot | null> {
  if (mediaType === "tv") {
    const tv = await fetchTvDetails(mediaId);
    return tv && tvToSnapshot(tv);
  }
  const movie = await fetchMovieDetails(mediaId);
  return movie && movieToSnapshot(movie);
}

/** Ajoute ou retire un média de la watchlist TMDB du compte connecté. */
export async function updateTmdbWatchlist(
  { sessionId, user }: TCurrentSession,
  mediaId: number,
  mediaType: TMediaType,
  watchlist: boolean
): Promise<void> {
  await tmdbClient.post(
    `/account/${user.tmdb_id}/watchlist`,
    { media_type: mediaType, media_id: mediaId, watchlist },
    { session_id: sessionId }
  );
}

/** Réplique en BDD de la watchlist TMDB (affichée sur le profil pour les amis). */
export async function syncWatchlistItem(
  userId: string,
  mediaId: number,
  mediaType: TMediaType,
  watchlist: boolean
): Promise<void> {
  if (!watchlist) {
    await prisma.watchlistItem.deleteMany({
      where: { userId, media_type: mediaType, tmdb_movie_id: mediaId },
    });
    return;
  }

  const snapshot = await fetchWatchlistSnapshot(mediaId, mediaType);
  if (!snapshot) return;

  const where = {
    userId_media_type_tmdb_movie_id: { userId, media_type: mediaType, tmdb_movie_id: mediaId },
  };
  const existing = await prisma.watchlistItem.findUnique({ where, select: { id: true } });
  await prisma.$transaction([
    prisma.watchlistItem.upsert({
      where,
      create: { userId, tmdb_movie_id: mediaId, media_type: mediaType, ...snapshot },
      update: snapshot,
    }),
    // Un ajout (pas une mise à jour) entre dans le fil d'activité des amis.
    ...(existing
      ? []
      : [
          upsertActivity(
            activityData(userId, "WATCHLIST_ADDED", {
              tmdbId: mediaId,
              mediaType,
              title: snapshot.title,
              posterPath: snapshot.poster_path,
            })
          ),
        ]),
  ]);
}

/** Pages TMDB lues au plus par type de média (20 médias par page). */
const MAX_PAGES = 25;

/** Watchlist TMDB entière d'un type de média (bornée à MAX_PAGES), du plus récent au plus ancien. */
async function fetchFullWatchlist(
  session: TCurrentSession,
  mediaType: TMediaType
): Promise<TRemoteWatchlistList> {
  if (mediaType === "tv") {
    const { items, complete } = await fetchAccountList<TWatchlistTv>(
      session,
      "watchlist/tv",
      MAX_PAGES
    );
    return {
      items: items.map((tv) => ({ tmdbId: tv.id, snapshot: tvToSnapshot(tv) })),
      complete,
    };
  }

  const { items, complete } = await fetchAccountList<TMovie>(
    session,
    "watchlist/movies",
    MAX_PAGES
  );
  return {
    items: items.map((movie) => ({ tmdbId: movie.id, snapshot: movieToSnapshot(movie) })),
    complete,
  };
}

/**
 * Recopie la watchlist TMDB en base : ajouts, retraits et données modifiées hors de l'app.
 * Les ajouts entrent dans le fil d'activité, sauf à l'import initial : la copie pouvait être
 * incomplète, toute la watchlist y arriverait d'un coup.
 */
export async function resyncWatchlist(
  session: TCurrentSession,
  now: Date,
  isInitialImport: boolean
): Promise<void> {
  const userId = session.user.id;
  // Copie lue avant TMDB : un média ajouté depuis l'app pendant la resynchro n'est ni dans
  // l'une ni dans l'autre, il ne peut donc pas être supprimé par erreur.
  const local = await prisma.watchlistItem.findMany({ where: { userId } });
  const [movie, tv] = await Promise.all([
    fetchFullWatchlist(session, "movie"),
    fetchFullWatchlist(session, "tv"),
  ]);
  const plan = planWatchlistResync(
    local.map((item) => ({
      tmdbId: item.tmdb_movie_id,
      mediaType: item.media_type === "tv" ? "tv" : "movie",
      addedAt: item.added_at,
      snapshot: {
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        overview: item.overview,
      },
    })),
    { movie, tv },
    now
  );

  const operations = [
    ...(plan.deletes.length > 0
      ? [
          prisma.watchlistItem.deleteMany({
            where: {
              userId,
              OR: plan.deletes.map(({ tmdbId, mediaType }) => ({
                media_type: mediaType,
                tmdb_movie_id: tmdbId,
              })),
            },
          }),
        ]
      : []),
    ...(plan.creates.length > 0
      ? [
          prisma.watchlistItem.createMany({
            data: plan.creates.map(({ tmdbId, mediaType, snapshot, addedAt }) => ({
              userId,
              tmdb_movie_id: tmdbId,
              media_type: mediaType,
              added_at: addedAt,
              ...snapshot,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
    ...plan.updates.map(({ tmdbId, mediaType, snapshot }) =>
      prisma.watchlistItem.updateMany({
        where: { userId, media_type: mediaType, tmdb_movie_id: tmdbId },
        data: snapshot,
      })
    ),
    ...(!isInitialImport && plan.creates.length > 0
      ? [
          prisma.activity.createMany({
            data: plan.creates.map(({ tmdbId, mediaType, snapshot }) =>
              activityData(userId, "WATCHLIST_ADDED", {
                tmdbId,
                mediaType,
                title: snapshot.title,
                posterPath: snapshot.poster_path,
              })
            ),
            // L'app a pu signaler le même ajout pendant la resynchro.
            skipDuplicates: true,
          }),
        ]
      : []),
  ];
  if (operations.length > 0) await prisma.$transaction(operations);
}
