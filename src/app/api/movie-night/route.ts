import { parseCreateMovieNightInput } from "@/lib/movie-night/validation";
import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonBody,
  withTmdbErrors,
} from "@/lib/server/movieNightHttp";
import { createMovieNight, getCurrentSession } from "@/lib/server/services";

/** Créer une session (connecté) : `{ providerIds, genreIds, deckSize, includeSeen?, solo? }` → `{ id }`. */
export async function POST(request: Request) {
  const current = await getCurrentSession();
  if (!current) return movieNightErrorResponse("unauthorized");

  const input = parseCreateMovieNightInput(await readJsonBody(request));
  if (!input.ok) return movieNightErrorResponse("invalid_input", input.message);

  return withTmdbErrors(async () =>
    movieNightResultResponse(await createMovieNight(current.user, input.value))
  );
}
