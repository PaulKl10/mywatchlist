import {
  movieNightErrorResponse,
  movieNightResultResponse,
  withTmdbErrors,
} from "@/lib/server/movieNightHttp";
import { resolveMovieNightParticipant, startMovieNight } from "@/lib/server/services";

/** Hôte : construit la pile 1 et passe en `SWIPING` → `TMovieNightState`. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  return withTmdbErrors(async () => movieNightResultResponse(await startMovieNight(id, actor)));
}
