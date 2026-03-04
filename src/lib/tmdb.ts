import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TMDBMovieMinimal = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
};

export async function fetchMovieDetails(
  movieId: number
): Promise<TMDBMovieMinimal | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const { data } = await axios.get<TMDBMovieMinimal>(
      `${TMDB_BASE_URL}/movie/${movieId}`,
      {
        params: { api_key: apiKey, language: "fr-FR" },
      }
    );
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
