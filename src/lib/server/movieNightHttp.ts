import { NextResponse } from "next/server";
import { MAX_PARTICIPANTS } from "@/lib/movie-night/constants";
import type { TMovieNightErrorCode } from "@/lib/movie-night/types";
import { MovieNightTmdbError } from "@/lib/server/services/movieNight.service";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const ERROR_STATUS: Record<TMovieNightErrorCode, number> = {
  unauthorized: 401,
  not_participant: 403,
  forbidden: 403,
  not_friends: 403,
  not_found: 404,
  invalid_code: 404,
  invalid_input: 400,
  session_full: 409,
  name_taken: 409,
  wrong_status: 409,
  match_pending: 409,
  already_voted: 409,
  not_finished: 409,
  no_movies: 422,
};

const ERROR_MESSAGE: Record<TMovieNightErrorCode, string> = {
  unauthorized: "Connectez-vous pour continuer.",
  not_participant: "Vous ne faites plus partie de cette session.",
  forbidden: "Vous n'avez pas le droit de faire cette action.",
  not_friends: "Vous ne pouvez inviter que vos amis.",
  not_found: "Cette session n'existe plus.",
  invalid_code: "Ce code ne correspond à aucune session ouverte.",
  invalid_input: "Requête invalide.",
  session_full: `La session est complète (${MAX_PARTICIPANTS} participants maximum).`,
  name_taken: "Ce pseudo est déjà pris dans cette session.",
  wrong_status: "Cette action n'est plus possible à ce stade de la session.",
  match_pending: "Un match attend une décision.",
  already_voted: "Vous avez déjà voté pour ce film.",
  not_finished: "Tout le monde n'a pas encore fini la pile.",
  no_movies: "Aucun film ne correspond, élargissez les plateformes ou les genres.",
};

const TMDB_UNAVAILABLE_MESSAGE = "TMDB est indisponible, réessayez.";

/** Réponse JSON jamais mise en cache (toutes les routes `/api/movie-night/**`). */
export function noStoreJson(data: unknown, init?: { status?: number }): NextResponse {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: NO_STORE_HEADERS });
}

/** Erreur `{ error, message }` avec le statut HTTP du code et un message par défaut en français. */
export function movieNightErrorResponse(error: TMovieNightErrorCode, message?: string): NextResponse {
  return noStoreJson(
    { error, message: message ?? ERROR_MESSAGE[error] },
    { status: ERROR_STATUS[error] }
  );
}

type TResultLike<T> =
  | { ok: true; value: T }
  | { ok: false; error: TMovieNightErrorCode; message?: string };

/** Résultat de service → réponse : la valeur (ou `toBody(valeur)`) en 200, sinon l'erreur. */
export function movieNightResultResponse<T>(
  result: TResultLike<T>,
  toBody: (value: T) => unknown = (value) => value
): NextResponse {
  return result.ok
    ? noStoreJson(toBody(result.value))
    : movieNightErrorResponse(result.error, result.message);
}

/**
 * Exécute `run` ; un échec TMDB pendant la construction d'une pile (déjà loggé avec
 * `tmdbErrorMessage`) devient un 500 `tmdb_error`. Les autres erreurs remontent.
 */
export async function withTmdbErrors(run: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof MovieNightTmdbError)) throw error;
    return noStoreJson(
      { error: "tmdb_error", message: TMDB_UNAVAILABLE_MESSAGE },
      { status: 500 }
    );
  }
}

/** Corps JSON de la requête, ou `undefined` s'il est absent ou mal formé. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Corps JSON s'il s'agit d'un objet, sinon un objet vide (les champs seront rejetés à la validation). */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const body = await readJsonBody(request);
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}
