import { tmdbClient } from "./tmdb-client";

/** ID du compte TMDB associé à une session. */
export async function getTmdbAccountId(sessionId: string): Promise<number> {
  const account = await tmdbClient.get<{ id: number }>("/account", {
    session_id: sessionId,
  });
  return account.id;
}

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
  episodes?: TMDBSeasonEpisode[];
};

type TMDBTvSeasonsSummary = {
  seasons?: { season_number: number }[];
};

type TMDBTvWithAppendedSeasons = {
  [key: `season/${number}`]: TMDBSeasonDetails | undefined;
};

/** Limite TMDB du nombre de sous-requêtes par append_to_response. */
const TMDB_MAX_APPENDED_RESPONSES = 20;

/**
 * Somme le runtime de tous les épisodes d'une série (en minutes), hors épisodes spéciaux (saison 0).
 * Les saisons sont récupérées par lots de 20 via append_to_response, en parallèle :
 * 38 saisons = 3 requêtes au lieu de 39 requêtes séquentielles.
 */
export async function fetchTvTotalRuntime(tvId: number): Promise<number | null> {
  try {
    const tvData = await tmdbClient.get<TMDBTvSeasonsSummary>(`/tv/${tvId}`, {
      language: "fr-FR",
    });

    const seasonNumbers = (tvData.seasons ?? [])
      .map((season) => season.season_number)
      .filter((seasonNumber) => seasonNumber > 0);
    if (seasonNumbers.length === 0) return 0;

    const batches: number[][] = [];
    for (let i = 0; i < seasonNumbers.length; i += TMDB_MAX_APPENDED_RESPONSES) {
      batches.push(seasonNumbers.slice(i, i + TMDB_MAX_APPENDED_RESPONSES));
    }

    const responses = await Promise.all(
      batches.map((batch) =>
        tmdbClient.get<TMDBTvWithAppendedSeasons>(`/tv/${tvId}`, {
          language: "fr-FR",
          append_to_response: batch.map((n) => `season/${n}`).join(","),
        })
      )
    );

    let total = 0;
    responses.forEach((data, index) => {
      for (const seasonNumber of batches[index]) {
        for (const episode of data[`season/${seasonNumber}`]?.episodes ?? []) {
          total += episode.runtime ?? 0;
        }
      }
    });
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
