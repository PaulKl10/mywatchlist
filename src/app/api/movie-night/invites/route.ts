import { movieNightErrorResponse, noStoreJson } from "@/lib/server/movieNightHttp";
import { getCurrentSession, listPendingInvites } from "@/lib/server/services";

/** Invitations en attente de l'utilisateur connecté → `{ invites: TMovieNightInvite[] }`. */
export async function GET() {
  const current = await getCurrentSession();
  if (!current) return movieNightErrorResponse("unauthorized");

  return noStoreJson({ invites: await listPendingInvites(current.user.id) });
}
