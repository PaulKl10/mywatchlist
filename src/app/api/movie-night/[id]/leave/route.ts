import { movieNightErrorResponse, movieNightResultResponse } from "@/lib/server/movieNightHttp";
import { leaveMovieNight, resolveMovieNightParticipant } from "@/lib/server/services";

/** Quitter la session (l'hôte la termine pour tout le monde) → `{ ok: true }`. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  return movieNightResultResponse(await leaveMovieNight(id, actor), () => ({ ok: true }));
}
