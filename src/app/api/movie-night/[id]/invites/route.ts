import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonObject,
} from "@/lib/server/movieNightHttp";
import {
  getCurrentSession,
  inviteFriend,
  resolveMovieNightParticipant,
  schedulePushNotification,
} from "@/lib/server/services";
import { userDisplayName } from "@/lib/server/services/movieNightState";

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

  const result = await inviteFriend(id, actor, friendUserId);
  if (result.ok && result.value.invited) {
    // L'hôte qui invite est forcément connecté (compte requis par `inviteFriend`).
    const current = await getCurrentSession();
    if (current) {
      schedulePushNotification(friendUserId, {
        type: "movie_night_invite",
        fromName: userDisplayName(current.user),
        movieNightId: id,
      });
    }
  }
  return movieNightResultResponse(result, () => ({ ok: true }));
}
