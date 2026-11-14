import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { tmdbClient } from "@/lib/tmdb-client";

// Message seul : une AxiosError embarque la config (api_key, session_id).
function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (sessionId) {
    // Révoque la session côté TMDB (sinon le session_id reste utilisable indéfiniment)
    // et côté BDD. Best effort : la déconnexion locale ne doit pas échouer pour autant.
    const [dbResult, tmdbResult] = await Promise.allSettled([
      prisma.session.deleteMany({ where: { tmdb_session_id: sessionId } }),
      tmdbClient.delete("/authentication/session", {}, { session_id: sessionId }),
    ]);

    if (dbResult.status === "rejected") {
      console.error("[logout] Suppression de la session en BDD impossible", errorMessage(dbResult.reason));
    }
    if (tmdbResult.status === "rejected") {
      console.error("[logout] Révocation de la session TMDB impossible", errorMessage(tmdbResult.reason));
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("tmdb_session_id");
  return response;
}
