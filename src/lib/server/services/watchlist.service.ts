import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";

export async function syncWatchlistItem(
  userId: string,
  mediaId: number,
  mediaType: "movie" | "tv",
  watchlist: boolean
): Promise<void> {
  if (watchlist) {
    if (mediaType === "tv") {
      const tv = await fetchTvDetails(mediaId);
      if (tv) {
        await prisma.watchlistItem.upsert({
          where: {
            userId_media_type_tmdb_movie_id: {
              userId,
              media_type: "tv",
              tmdb_movie_id: mediaId,
            },
          },
          create: {
            userId,
            tmdb_movie_id: mediaId,
            media_type: "tv",
            poster_path: tv.poster_path,
            title: tv.name,
            release_date: tv.first_air_date || null,
            vote_average: tv.vote_average,
            overview: tv.overview || null,
          },
          update: {
            poster_path: tv.poster_path,
            title: tv.name,
            release_date: tv.first_air_date || null,
            vote_average: tv.vote_average,
            overview: tv.overview || null,
          },
        });
      }
    } else {
      const movie = await fetchMovieDetails(mediaId);
      if (movie) {
        await prisma.watchlistItem.upsert({
          where: {
            userId_media_type_tmdb_movie_id: {
              userId,
              media_type: "movie",
              tmdb_movie_id: mediaId,
            },
          },
          create: {
            userId,
            tmdb_movie_id: mediaId,
            media_type: "movie",
            poster_path: movie.poster_path,
            title: movie.title,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average,
            overview: movie.overview || null,
          },
          update: {
            poster_path: movie.poster_path,
            title: movie.title,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average,
            overview: movie.overview || null,
          },
        });
      }
    }
  } else {
    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        media_type: mediaType,
        tmdb_movie_id: mediaId,
      },
    });
  }
}
