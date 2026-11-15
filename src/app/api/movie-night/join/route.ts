import {
  movieNightErrorResponse,
  noStoreJson,
  readJsonObject,
} from "@/lib/server/movieNightHttp";
import {
  getCurrentSession,
  joinMovieNightByCode,
  setGuestCookie,
} from "@/lib/server/services";

/** Rejoindre par code : `{ code, guestName? }` → `{ id }` ; pose le cookie invité si besoin. */
export async function POST(request: Request) {
  const { code, guestName } = await readJsonObject(request);
  if (typeof code !== "string") return movieNightErrorResponse("invalid_input");

  const user = (await getCurrentSession())?.user ?? null;
  const result = await joinMovieNightByCode({ code, user, guestName });
  if (!result.ok) return movieNightErrorResponse(result.error, result.message);

  const { id, guestToken, expiresAt } = result.value;
  if (guestToken) await setGuestCookie(guestToken, expiresAt);
  return noStoreJson({ id });
}
