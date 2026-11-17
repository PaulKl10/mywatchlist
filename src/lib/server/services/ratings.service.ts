import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";
import {
  planRatingsResync,
  type TRatingSnapshot,
  type TRemoteRatingList,
} from "@/lib/ratings/resync";
import type { TMediaType } from "@/types/movie.type";
import { activityData, deleteActivities, upsertActivity } from "./activity.service";
import type { TCurrentSession } from "./session.service";
import { fetchAccountList } from "./tmdbAccount.service";

/** Pages TMDB de notes lues au plus par type de média (20 notes par page). */
const MAX_PAGES = 25;

type TRatedMovieItem = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string | null;
  genre_ids?: number[];
  rating: number;
};

type TRatedTvItem = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string | null;
  genre_ids?: number[];
  rating: number;
};

async function fetchRemoteRatings(
  session: TCurrentSession,
  mediaType: TMediaType
): Promise<TRemoteRatingList> {
  if (mediaType === "tv") {
    const { items, complete } = await fetchAccountList<TRatedTvItem>(session, "rated/tv", MAX_PAGES);
    return {
      items: items.map((tv) => ({
        tmdbId: tv.id,
        snapshot: {
          rating: tv.rating,
          title: tv.name,
          poster_path: tv.poster_path,
          release_date: tv.first_air_date || null,
          genre_ids: tv.genre_ids ?? [],
        },
      })),
      complete,
    };
  }

  const { items, complete } = await fetchAccountList<TRatedMovieItem>(
    session,
    "rated/movies",
    MAX_PAGES
  );
  return {
    items: items.map((movie) => ({
      tmdbId: movie.id,
      snapshot: {
        rating: movie.rating,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date || null,
        genre_ids: movie.genre_ids ?? [],
      },
    })),
    complete,
  };
}

const uniqueKey = (userId: string, mediaType: TMediaType, tmdbId: number) => ({
  userId_media_type_tmdb_id: { userId, media_type: mediaType, tmdb_id: tmdbId },
});

/**
 * Recopie les notes TMDB en base : notes données, changées ou retirées hors de l'app. Les
 * notes nouvelles ou changées (hors import initial) sont datées et entrent dans le fil d'activité.
 */
export async function resyncRatings(
  session: TCurrentSession,
  now: Date,
  isInitialImport: boolean
): Promise<void> {
  const userId = session.user.id;
  // Copie lue avant TMDB : une note donnée depuis l'app pendant la resynchro n'est ni dans
  // l'une ni dans l'autre, elle ne peut donc pas être supprimée par erreur.
  const local = await prisma.ratingItem.findMany({ where: { userId } });
  const [movie, tv] = await Promise.all([
    fetchRemoteRatings(session, "movie"),
    fetchRemoteRatings(session, "tv"),
  ]);
  const plan = planRatingsResync(
    local.map((item) => ({
      tmdbId: item.tmdb_id,
      mediaType: item.media_type === "tv" ? "tv" : "movie",
      ratedAt: item.rated_at,
      snapshot: {
        rating: item.rating,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        genre_ids: item.genre_ids,
      },
    })),
    { movie, tv },
    now,
    isInitialImport
  );

  const operations = [
    ...(plan.deletes.length > 0
      ? [
          prisma.ratingItem.deleteMany({
            where: {
              userId,
              OR: plan.deletes.map(({ tmdbId, mediaType }) => ({
                media_type: mediaType,
                tmdb_id: tmdbId,
              })),
            },
          }),
        ]
      : []),
    ...(plan.creates.length > 0
      ? [
          prisma.ratingItem.createMany({
            data: plan.creates.map(({ tmdbId, mediaType, snapshot, ratedAt }) => ({
              userId,
              tmdb_id: tmdbId,
              media_type: mediaType,
              rated_at: ratedAt,
              ...snapshot,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
    ...plan.updates.map(({ tmdbId, mediaType, snapshot, ratedAt }) =>
      prisma.ratingItem.updateMany({
        where: { userId, media_type: mediaType, tmdb_id: tmdbId },
        data: { ...snapshot, ...(ratedAt && { rated_at: ratedAt }) },
      })
    ),
    // Une note retirée sur TMDB sort aussi du fil des amis.
    ...(plan.deletes.length > 0 ? [deleteActivities(userId, "RATED", plan.deletes)] : []),
    ...plan.activities.flatMap(({ tmdbId, mediaType, snapshot }) =>
      upsertActivity(
        activityData(
          userId,
          "RATED",
          { tmdbId, mediaType, title: snapshot.title, posterPath: snapshot.poster_path },
          snapshot.rating
        )
      )
    ),
    // Dans la même transaction : des notes importées sans date n'existent jamais sans cette date,
    // dont dépend la purge des copies trop vieilles.
    prisma.user.update({ where: { id: userId }, data: { ratings_synced_at: now } }),
  ];
  await prisma.$transaction(operations);
}

async function fetchRatingSnapshot(
  mediaType: TMediaType,
  mediaId: number,
  rating: number
): Promise<TRatingSnapshot | null> {
  if (mediaType === "tv") {
    const tv = await fetchTvDetails(mediaId);
    return (
      tv && {
        rating,
        title: tv.name,
        poster_path: tv.poster_path,
        release_date: tv.first_air_date || null,
        genre_ids: tv.genre_ids,
      }
    );
  }
  const movie = await fetchMovieDetails(mediaId);
  return (
    movie && {
      rating,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date || null,
      genre_ids: movie.genre_ids,
    }
  );
}

/**
 * Note donnée depuis l'app : copiée tout de suite et ajoutée au fil. Elle est datée de
 * maintenant si c'est la première note du titre vue par l'app (une note changée garde sa
 * date, comme le temps de visionnage).
 */
export async function recordRating(
  userId: string,
  mediaType: TMediaType,
  mediaId: number,
  rating: number
): Promise<void> {
  const snapshot = await fetchRatingSnapshot(mediaType, mediaId, rating);
  if (!snapshot) return;
  const now = new Date();

  await prisma.$transaction([
    prisma.ratingItem.upsert({
      where: uniqueKey(userId, mediaType, mediaId),
      create: { userId, tmdb_id: mediaId, media_type: mediaType, rated_at: now, ...snapshot },
      update: snapshot,
    }),
    prisma.ratingItem.updateMany({
      where: { userId, media_type: mediaType, tmdb_id: mediaId, rated_at: null },
      data: { rated_at: now },
    }),
    ...upsertActivity(
      activityData(
        userId,
        "RATED",
        { tmdbId: mediaId, mediaType, title: snapshot.title, posterPath: snapshot.poster_path },
        rating
      )
    ),
  ]);
}

/** Note retirée depuis l'app : sortie de la copie et du fil. */
export async function removeRating(
  userId: string,
  mediaType: TMediaType,
  mediaId: number
): Promise<void> {
  await prisma.$transaction([
    prisma.ratingItem.deleteMany({ where: { userId, media_type: mediaType, tmdb_id: mediaId } }),
    deleteActivities(userId, "RATED", [{ tmdbId: mediaId, mediaType }]),
  ]);
}
