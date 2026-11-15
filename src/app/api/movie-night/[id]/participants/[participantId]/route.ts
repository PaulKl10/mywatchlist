import { movieNightErrorResponse, movieNightResultResponse } from "@/lib/server/movieNightHttp";
import { removeParticipant, resolveMovieNightParticipant } from "@/lib/server/services";

/** Hôte : retirer un participant → `TMovieNightState`. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { id, participantId } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  return movieNightResultResponse(await removeParticipant(id, actor, participantId));
}
