import { movieNightErrorResponse, movieNightResultResponse } from "@/lib/server/movieNightHttp";
import { getMovieNightState, resolveMovieNightParticipant } from "@/lib/server/services";

/** État de la session pour le polling → `TMovieNightState`. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  return movieNightResultResponse(await getMovieNightState(id, actor));
}
