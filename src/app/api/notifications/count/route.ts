import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countPendingInvites, getCurrentSession } from "@/lib/server/services";

export type TNotificationCount = {
  friendRequests: number;
  suggestions: number;
  movieNightInvites: number;
  total: number;
};

export async function GET() {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({
      friendRequests: 0,
      suggestions: 0,
      movieNightInvites: 0,
      total: 0,
    } satisfies TNotificationCount);
  }

  const [friendRequestsCount, suggestionsCount, movieNightInvitesCount] =
    await Promise.all([
      prisma.friendship.count({
        where: {
          receiverId: current.user.id,
          status: "PENDING",
        },
      }),
      prisma.suggestion.count({
        where: { toUserId: current.user.id },
      }),
      countPendingInvites(current.user.id),
    ]);

  return NextResponse.json({
    friendRequests: friendRequestsCount,
    suggestions: suggestionsCount,
    movieNightInvites: movieNightInvitesCount,
    total: friendRequestsCount + suggestionsCount + movieNightInvitesCount,
  } satisfies TNotificationCount);
}
