import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getWatchTimeStats, type TWatchTimeStats } from "@/lib/server/services";

export type TWatchTimeResponse = TWatchTimeStats;

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const stats: TWatchTimeResponse = await getWatchTimeStats(user.id);
  return NextResponse.json(stats);
}
