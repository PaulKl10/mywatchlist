import { prisma } from "@/lib/prisma";
import { fetchMovieDetails } from "@/lib/tmdb";

export async function syncWatchlistItem(
  userId: string,
  mediaId: number,
  watchlist: boolean
): Promise<void> {
  if (watchlist) {
    const movie = await fetchMovieDetails(mediaId);
    if (movie) {
      await prisma.watchlistItem.upsert({
        where: {
          userId_tmdb_movie_id: {
            userId,
            tmdb_movie_id: mediaId,
          },
        },
        create: {
          userId,
          tmdb_movie_id: mediaId,
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
  } else {
    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        tmdb_movie_id: mediaId,
      },
    });
  }
}
