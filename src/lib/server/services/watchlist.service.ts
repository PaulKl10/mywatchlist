import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";
import { tmdbClient } from "@/lib/tmdb-client";
import type { TMediaType } from "@/types/movie.type";
import type { TCurrentSession } from "./session.service";

type TWatchlistSnapshot = {
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
  overview: string | null;
};

async function fetchWatchlistSnapshot(
  mediaId: number,
  mediaType: TMediaType
): Promise<TWatchlistSnapshot | null> {
  if (mediaType === "tv") {
    const tv = await fetchTvDetails(mediaId);
    return (
      tv && {
        title: tv.name,
        poster_path: tv.poster_path,
        release_date: tv.first_air_date || null,
        vote_average: tv.vote_average,
        overview: tv.overview || null,
      }
    );
  }

  const movie = await fetchMovieDetails(mediaId);
  return (
    movie && {
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date || null,
      vote_average: movie.vote_average,
      overview: movie.overview || null,
    }
  );
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
