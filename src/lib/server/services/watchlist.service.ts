import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";
import { planWatchlistResync, type TRemoteWatchlistList } from "@/lib/watchlist/resync";
import {
  movieToSnapshot,
  tvToSnapshot,
  type TWatchlistSnapshot,
} from "@/lib/watchlist/snapshot";
import type {
  TDiscoverMoviesResponse,
  TMediaType,
  TWatchlistTvResponse,
} from "@/types/movie.type";
import type { TCurrentSession } from "./session.service";

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

  await prisma.watchlistItem.upsert({
    where: {
      userId_media_type_tmdb_movie_id: {
        userId,
        media_type: mediaType,
        tmdb_movie_id: mediaId,
      },
    },
    create: {
      userId,
      tmdb_movie_id: mediaId,
      media_type: mediaType,
      ...snapshot,
    },
    update: snapshot,
  });
}

/** Resynchro complète de la copie au plus une fois par heure et par utilisateur. */
const RESYNC_INTERVAL_MS = 60 * 60 * 1000;
/**
 * Âge maximal des données d'une copie : TMDB interdit de les garder plus de 6 mois. La copie
 * d'un utilisateur absent depuis plus longtemps est supprimée, et recréée à son retour.
 */
const COPY_MAX_AGE_MS = 150 * 24 * 60 * 60 * 1000;
/** Pages TMDB lues au plus par type de média (20 médias par page). */
const MAX_PAGES = 25;
/** Pages TMDB demandées en parallèle. */
const PAGE_CONCURRENCY = 5;
/** TMDB trie les listes du compte du plus ancien au plus récent par défaut. */
const NEWEST_FIRST = "created_at.desc";

type TWatchlistPage = Pick<TRemoteWatchlistList, "items"> & { totalPages: number };

async function fetchWatchlistPage(
  { sessionId, user }: TCurrentSession,
  mediaType: TMediaType,
  page: number
): Promise<TWatchlistPage> {
  const params = { session_id: sessionId, page, language: "fr-FR", sort_by: NEWEST_FIRST };

  if (mediaType === "tv") {
    const data = await tmdbClient.get<TWatchlistTvResponse>(
      `/account/${user.tmdb_id}/watchlist/tv`,
      params
    );
    return {
      items: data.results.map((tv) => ({ tmdbId: tv.id, snapshot: tvToSnapshot(tv) })),
      totalPages: data.total_pages,
    };
  }

  const data = await tmdbClient.get<TDiscoverMoviesResponse>(
    `/account/${user.tmdb_id}/watchlist/movies`,
    params
  );
  return {
    items: data.results.map((movie) => ({ tmdbId: movie.id, snapshot: movieToSnapshot(movie) })),
    totalPages: data.total_pages,
  };
}

/** Watchlist TMDB entière d'un type de média (bornée à MAX_PAGES), du plus récent au plus ancien. */
async function fetchFullWatchlist(
  session: TCurrentSession,
  mediaType: TMediaType
): Promise<TRemoteWatchlistList> {
  const first = await fetchWatchlistPage(session, mediaType, 1);
  const lastPage = Math.min(first.totalPages, MAX_PAGES);
  const items = [...first.items];

  for (let start = 2; start <= lastPage; start += PAGE_CONCURRENCY) {
    const end = Math.min(start + PAGE_CONCURRENCY - 1, lastPage);
    const pages = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) =>
        fetchWatchlistPage(session, mediaType, start + i)
      )
    );
    for (const page of pages) items.push(...page.items);
  }

  return { items, complete: first.totalPages <= MAX_PAGES };
}

/** Recopie la watchlist TMDB en base : ajouts, retraits et données modifiées hors de l'app. */
async function resyncWatchlistCopy(session: TCurrentSession): Promise<void> {
  const { user } = session;
  const startedAt = new Date();

  // Réserve la resynchro : une seule à la fois par utilisateur, même avec plusieurs onglets.
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

  try {
    // Copie lue avant TMDB : un média ajouté depuis l'app pendant la resynchro n'est ni dans
    // l'une ni dans l'autre, il ne peut donc pas être supprimé par erreur.
    const local = await prisma.watchlistItem.findMany({ where: { userId: user.id } });
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
      startedAt
    );

    const operations = [
      ...(plan.deletes.length > 0
        ? [
            prisma.watchlistItem.deleteMany({
              where: {
                userId: user.id,
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
                userId: user.id,
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
          where: { userId: user.id, media_type: mediaType, tmdb_movie_id: tmdbId },
          data: snapshot,
        })
      ),
    ];
    if (operations.length > 0) await prisma.$transaction(operations);
  } catch (error) {
    // Données non rafraîchies : la date reprend sa valeur, pour que la prochaine visite
    // réessaie et que la purge des copies trop vieilles reste juste.
    await prisma.user
      .updateMany({
        where: { id: user.id, watchlist_synced_at: startedAt },
        data: { watchlist_synced_at: user.watchlist_synced_at },
      })
      .catch(() => undefined);
    console.error("[watchlist] Resynchro impossible", tmdbErrorMessage(error));
    return;
  }

  await purgeStaleWatchlistCopies(startedAt);
}

/**
 * Supprime les copies dont les données ont plus de COPY_MAX_AGE_MS : celles des utilisateurs
 * sans resynchro depuis, ou jamais resynchronisés (l'âge est alors celui de l'ajout).
 */
async function purgeStaleWatchlistCopies(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - COPY_MAX_AGE_MS);
  try {
    await prisma.watchlistItem.deleteMany({
      where: {
        OR: [
          { user: { watchlist_synced_at: { lt: cutoff } } },
          { user: { watchlist_synced_at: null }, added_at: { lt: cutoff } },
        ],
      },
    });
  } catch (error) {
    console.error("[watchlist] Purge des copies trop vieilles impossible", tmdbErrorMessage(error));
  }
}

/**
 * Planifie, après la réponse, la resynchro de la copie si la dernière date de plus d'une
 * heure. À appeler depuis un Route Handler uniquement.
 */
export function scheduleWatchlistResync(session: TCurrentSession): void {
  const lastSync = session.user.watchlist_synced_at;
  if (lastSync && Date.now() - lastSync.getTime() < RESYNC_INTERVAL_MS) return;
  if (!tmdbClient.isConfigured()) return;
  after(async () => {
    try {
      await resyncWatchlistCopy(session);
    } catch (error) {
      console.error("[watchlist] Resynchro interrompue", tmdbErrorMessage(error));
    }
  });
}
