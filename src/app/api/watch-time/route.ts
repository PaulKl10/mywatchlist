import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TWatchTimeResponse = {
  totalMinutes: number;
  totalHours: number;
  movieCount: number;
};

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

  const [aggregate, movieCount] = await Promise.all([
    prisma.watchTimeEntry.aggregate({
      where: { userId: user.id },
      _sum: { runtime: true },
    }),
    prisma.watchTimeEntry.count({
      where: { userId: user.id },
    }),
  ]);

  const totalMinutes = aggregate._sum.runtime ?? 0;
  const totalHours = Math.floor(totalMinutes / 60);

  return NextResponse.json({
    totalMinutes,
    totalHours,
    movieCount,
  } satisfies TWatchTimeResponse);
}
