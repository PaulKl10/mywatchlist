import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Cookie httpOnly contenant le session_id TMDB. */
export const SESSION_COOKIE = "tmdb_session_id";

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
