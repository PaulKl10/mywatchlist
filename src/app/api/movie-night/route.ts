import { parseCreateMovieNightInput } from "@/lib/movie-night/validation";
import {
  movieNightErrorResponse,
  movieNightResultResponse,
  noStoreJson,
  readJsonObject,
  withTmdbErrors,
} from "@/lib/server/movieNightHttp";
import {
  createGuestMovieNight,
  createMovieNight,
  getCurrentSession,
  setGuestCookie,
} from "@/lib/server/services";

/**
 * Créer une session en salle d'attente : `{ providerIds, genreIds, includeSeen? }` → `{ id }`.
 * Sans compte, `guestName` est requis : l'hôte devient un invité (cookie invité posé).
 */
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const input = parseCreateMovieNightInput(body);
  if (!input.ok) return movieNightErrorResponse("invalid_input", input.message);

  const current = await getCurrentSession();
  if (current) {
    return withTmdbErrors(async () =>
      movieNightResultResponse(await createMovieNight(current.user, input.value))
    );
  }

  const result = await createGuestMovieNight({ guestName: body.guestName, settings: input.value });
  if (!result.ok) return movieNightErrorResponse(result.error, result.message);

  const { id, guestToken, expiresAt } = result.value;
  await setGuestCookie(guestToken, expiresAt);
  return noStoreJson({ id });
}
