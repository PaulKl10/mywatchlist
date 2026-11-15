import {
  movieNightErrorResponse,
  movieNightResultResponse,
  readJsonObject,
} from "@/lib/server/movieNightHttp";
import {
  getCurrentSession,
  resolveMovieNightParticipant,
  respondToInvite,
} from "@/lib/server/services";

/** Invité connecté : répondre à une invitation `{ accept: boolean }` → `{ id }`. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentSession();
  if (!current) return movieNightErrorResponse("unauthorized");

  const { id } = await params;
  const actor = await resolveMovieNightParticipant(id);
  if (!actor) return movieNightErrorResponse("not_participant");

  const { accept } = await readJsonObject(request);
  if (typeof accept !== "boolean") return movieNightErrorResponse("invalid_input");

  return movieNightResultResponse(await respondToInvite(id, current.user, accept));
}
