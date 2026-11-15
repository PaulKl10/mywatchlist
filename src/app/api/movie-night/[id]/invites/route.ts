import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonObject,
} from "@/lib/server/movieNightHttp";
import { inviteFriend, resolveMovieNightParticipant } from "@/lib/server/services";

/** Hôte : inviter un ami accepté `{ friendUserId }` → `{ ok: true }`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  const { friendUserId } = await readJsonObject(request);
  if (typeof friendUserId !== "string" || friendUserId.length === 0) {
    return movieNightErrorResponse("invalid_input");
  }

  return movieNightResultResponse(await inviteFriend(id, actor, friendUserId), () => ({
    ok: true,
  }));
}
