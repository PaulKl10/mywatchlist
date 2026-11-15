import {
  movieNightErrorResponse,
  movieNightResultResponse,
  withTmdbErrors,
} from "@/lib/server/movieNightHttp";
import { resolveMovieNightParticipant, startNewRound } from "@/lib/server/services";

/**
 * Chef du groupe (ou participant actif si l'hôte est inactif) : nouvelle pile quand tous les
 * actifs ont fini la pile courante → `TMovieNightState`.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  return withTmdbErrors(async () => movieNightResultResponse(await startNewRound(id, actor)));
}
