import { tmdbClient } from "./tmdb-client";

export type TMDBMovieMinimal = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
};

export type TMDBTvMinimal = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  overview: string;
};

export async function fetchMovieDetails(
  movieId: number
): Promise<TMDBMovieMinimal | null> {
  try {
    const data = await tmdbClient.get<TMDBMovieMinimal>(`/movie/${movieId}`, {
      language: "fr-FR",
    });
    return {
      id: data.id,
      title: data.title,
      poster_path: data.poster_path ?? null,
      release_date: data.release_date ?? "",
      vote_average: data.vote_average ?? 0,
      overview: data.overview ?? "",
    };
  } catch {
    return null;
  }
}

export async function fetchMovieRuntime(
  movieId: number
): Promise<number | null> {
  try {
    const data = await tmdbClient.get<{ runtime: number | null }>(
      `/movie/${movieId}`,
      { language: "fr-FR" }
    );
    return data.runtime ?? null;
  } catch {
    return null;
  }
}

type TMDBSeasonEpisode = {
  episode_number: number;
  runtime: number | null;
};

type TMDBSeasonDetails = {
  episodes: TMDBSeasonEpisode[];
};

/** Somme le runtime de tous les épisodes d'une série (en minutes). */
export async function fetchTvTotalRuntime(tvId: number): Promise<number | null> {
  try {
    const tvData = await tmdbClient.get<{ number_of_seasons: number }>(
      `/tv/${tvId}`,
      { language: "fr-FR" }
    );

    const numSeasons = tvData.number_of_seasons ?? 0;
    if (numSeasons === 0) return 0;

    let total = 0;
    for (let s = 1; s <= numSeasons; s++) {
      const seasonData = await tmdbClient.get<TMDBSeasonDetails>(
        `/tv/${tvId}/season/${s}`,
        { language: "fr-FR" }
      );
      for (const ep of seasonData.episodes ?? []) {
        total += ep.runtime ?? 0;
      }
    }
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

export async function fetchTvDetails(
  tvId: number
): Promise<TMDBTvMinimal | null> {
  try {
    const data = await tmdbClient.get<TMDBTvMinimal>(`/tv/${tvId}`, {
      language: "fr-FR",
    });
    return {
      id: data.id,
      name: data.name,
      poster_path: data.poster_path ?? null,
      first_air_date: data.first_air_date ?? "",
      vote_average: data.vote_average ?? 0,
      overview: data.overview ?? "",
    };
  } catch {
    return null;
  }
}
