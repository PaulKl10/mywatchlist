import { prisma } from "@/lib/prisma";

export async function getUserFromSessionId(
  sessionId: string | undefined
): Promise<{ id: string } | null> {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  return session?.user ?? null;
}
