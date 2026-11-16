import { parseSoloDeckInput } from "@/lib/movie-night/validation";
import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonBody,
  withTmdbErrors,
} from "@/lib/server/movieNightHttp";
import { buildSoloDeck, getCurrentSession } from "@/lib/server/services";

/**
 * Pile d'une partie solo (connecté ou non), sans session en base :
 * `{ providerIds, genreIds, includeSeen?, excludedMovieIds? }` → `{ deck }`.
 */
export async function POST(request: Request) {
  const user = (await getCurrentSession())?.user ?? null;

  const input = parseSoloDeckInput(await readJsonBody(request));
  if (!input.ok) return movieNightErrorResponse("invalid_input", input.message);

  const { excludedMovieIds, ...settings } = input.value;
  return withTmdbErrors(async () =>
    movieNightResultResponse(await buildSoloDeck(user, settings, excludedMovieIds), (deck) => ({
      deck,
    }))
  );
}
