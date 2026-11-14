import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is not configured");
  }
  return key;
}

type TMDBParams = Record<string, string | number | boolean | undefined>;

function withApiKey(params: TMDBParams = {}): TMDBParams {
  return { ...params, api_key: getApiKey() };
}

/** True si TMDB a répondu 404 (ressource inexistante ou déjà supprimée). */
export function isTmdbNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export const tmdbClient = {
  /** GET vers TMDB. Ajoute automatiquement api_key. */
  async get<T>(path: string, params: TMDBParams = {}): Promise<T> {
    const { data } = await axios.get<T>(`${TMDB_BASE_URL}${path}`, {
      params: withApiKey(params),
    });
    return data;
  },

  /** POST vers TMDB. Ajoute automatiquement api_key aux params. */
  async post<T>(
    path: string,
    body: unknown,
    params: TMDBParams = {}
  ): Promise<T> {
    const { data } = await axios.post<T>(`${TMDB_BASE_URL}${path}`, body, {
      params: withApiKey(params),
      headers: { "Content-Type": "application/json" },
    });
    return data;
  },

  /** DELETE vers TMDB. Ajoute automatiquement api_key. `body` est envoyé en JSON si fourni. */
  async delete<T>(
    path: string,
    params: TMDBParams = {},
    body?: unknown
  ): Promise<T> {
    const { data } = await axios.delete<T>(`${TMDB_BASE_URL}${path}`, {
      params: withApiKey(params),
      ...(body !== undefined && {
        data: body,
        headers: { "Content-Type": "application/json" },
      }),
    });
    return data;
  },

  /** Vérifie si la clé API est configurée (sans lancer d'erreur). */
  isConfigured(): boolean {
    return Boolean(process.env.TMDB_API_KEY);
  },
};
