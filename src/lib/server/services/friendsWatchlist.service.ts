import { prisma } from "@/lib/prisma";
import type { TMovie } from "@/types/movie.type";
import { getFriendIds } from "./friends.service";

function watchlistItemToMovie(item: {
  tmdb_movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
}): TMovie {
  return {
    id: item.tmdb_movie_id,
    title: item.title,
    adult: false,
    backdrop_path: "",
    genre_ids: [],
    original_language: "fr",
    original_title: item.title,
    overview: item.overview ?? "",
    popularity: 0,
    poster_path: item.poster_path,
    release_date: item.release_date ?? "",
    video: false,
    vote_average: item.vote_average ?? 0,
    vote_count: 0,
  };
}

export async function getFriendsWatchlistMovies(
  userId: string
): Promise<TMovie[]> {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];

  const items = await prisma.watchlistItem.findMany({
    where: { userId: { in: friendIds } },
    orderBy: { added_at: "desc" },
  });

  const seen = new Set<number>();
  const movies: TMovie[] = [];
  for (const item of items) {
    if (seen.has(item.tmdb_movie_id)) continue;
    seen.add(item.tmdb_movie_id);
    movies.push(watchlistItemToMovie(item));
  }

  // Shuffle
  for (let i = movies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [movies[i], movies[j]] = [movies[j], movies[i]];
  }

  return movies.slice(0, 30);
}
