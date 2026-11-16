import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/constants";
import { tmdbClient } from "@/lib/tmdb-client";

export { SESSION_COOKIE };

/** Révoque une session côté TMDB (sinon le session_id reste utilisable indéfiniment). */
export async function revokeTmdbSession(sessionId: string): Promise<void> {
  await tmdbClient.delete("/authentication/session", {}, { session_id: sessionId });
}

/** session_id TMDB de la requête courante (lu dans le cookie), ou undefined. */
export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function getUserFromSessionId(
  sessionId: string | undefined
): Promise<User | null> {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  return session?.user ?? null;
}

export type TCurrentSession = {
  sessionId: string;
  user: User;
};

/** session_id + utilisateur de la requête courante, ou null si non connecté. */
export async function getCurrentSession(): Promise<TCurrentSession | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const user = await getUserFromSessionId(sessionId);
  return user ? { sessionId, user } : null;
}
