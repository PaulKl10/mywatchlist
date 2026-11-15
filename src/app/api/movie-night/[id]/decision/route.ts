import { parseMovieNightDecision } from "@/lib/movie-night/validation";
import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonBody,
} from "@/lib/server/movieNightHttp";
import { decide, resolveMovieNightParticipant } from "@/lib/server/services";

/**
 * Chef du groupe (ou participant actif si l'hôte est inactif) :
 * `{ action: "watch", movieId }` ou `{ action: "continue" }` → `TMovieNightState`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  const decision = parseMovieNightDecision(await readJsonBody(request));
  if (!decision) return movieNightErrorResponse("invalid_input");

  return movieNightResultResponse(await decide(id, actor, decision));
}
