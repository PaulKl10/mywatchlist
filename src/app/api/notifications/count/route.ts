import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TNotificationCount = {
  friendRequests: number;
  suggestions: number;
  total: number;
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
    return NextResponse.json({
      friendRequests: 0,
      suggestions: 0,
      total: 0,
    } satisfies TNotificationCount);
  }

  const [friendRequestsCount, suggestionsCount] = await Promise.all([
    prisma.friendship.count({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
    }),
    prisma.suggestion.count({
      where: { toUserId: user.id },
    }),
  ]);

  const total = friendRequestsCount + suggestionsCount;

  return NextResponse.json({
    friendRequests: friendRequestsCount,
    suggestions: suggestionsCount,
    total,
  } satisfies TNotificationCount);
}
