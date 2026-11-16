/** Données d'un film ou d'une série gardées dans la copie de la watchlist (table WatchlistItem). */
export type TWatchlistSnapshot = {
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
};

type TMovieLike = {
  title: string;
  poster_path: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

type TTvLike = {
  name: string;
  poster_path: string | null;
  first_air_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

export function movieToSnapshot(movie: TMovieLike): TWatchlistSnapshot {
  return {
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date || null,
    vote_average: movie.vote_average ?? null,
    overview: movie.overview || null,
  };
}

export function tvToSnapshot(tv: TTvLike): TWatchlistSnapshot {
  return {
    title: tv.name,
    poster_path: tv.poster_path,
    release_date: tv.first_air_date || null,
    vote_average: tv.vote_average ?? null,
    overview: tv.overview || null,
  };
}

export function isSameSnapshot(a: TWatchlistSnapshot, b: TWatchlistSnapshot): boolean {
  return (
    a.title === b.title &&
    a.poster_path === b.poster_path &&
    a.release_date === b.release_date &&
    a.vote_average === b.vote_average &&
    a.overview === b.overview
  );
}
