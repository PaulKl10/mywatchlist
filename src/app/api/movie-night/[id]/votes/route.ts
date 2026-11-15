import { parseVoteInput } from "@/lib/movie-night/validation";
import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonBody,
} from "@/lib/server/movieNightHttp";
import { castVote, resolveMovieNightParticipant } from "@/lib/server/services";

/** Vote sur un film de la pile courante `{ movieId, liked }` → `TMovieNightState`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  const vote = parseVoteInput(await readJsonBody(request));
  if (!vote) return movieNightErrorResponse("invalid_input");

  return movieNightResultResponse(await castVote(id, actor, vote));
}
