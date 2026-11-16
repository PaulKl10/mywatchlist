import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, getSessionId, revokeTmdbSession } from "@/lib/server/services";
import { tmdbErrorMessage } from "@/lib/tmdb-client";

export async function POST() {
  const sessionId = await getSessionId();

  if (sessionId) {
    // Révoque la session côté TMDB et côté BDD. Best effort : la déconnexion locale
    // ne doit pas échouer pour autant.
    const [dbResult, tmdbResult] = await Promise.allSettled([
      prisma.session.deleteMany({ where: { tmdb_session_id: sessionId } }),
      revokeTmdbSession(sessionId),
    ]);

    if (dbResult.status === "rejected") {
      console.error("[logout] Suppression de la session en BDD impossible", tmdbErrorMessage(dbResult.reason));
    }
    if (tmdbResult.status === "rejected") {
      console.error("[logout] Révocation de la session TMDB impossible", tmdbErrorMessage(tmdbResult.reason));
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
