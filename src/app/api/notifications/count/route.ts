import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  countPendingInvites,
  countUnreadNotifications,
  getCurrentSession,
} from "@/lib/server/services";

export type TNotificationCount = {
  friendRequests: number;
  suggestions: number;
  movieNightInvites: number;
  /** Réponses à mes suggestions pas encore vues. */
  answers: number;
  total: number;
};

export async function GET() {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({
      friendRequests: 0,
      suggestions: 0,
      movieNightInvites: 0,
      answers: 0,
      total: 0,
    } satisfies TNotificationCount);
  }

  const [friendRequestsCount, suggestionsCount, movieNightInvitesCount, answersCount] =
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
      countUnreadNotifications(current.user.id),
    ]);

  return NextResponse.json({
    friendRequests: friendRequestsCount,
    suggestions: suggestionsCount,
    movieNightInvites: movieNightInvitesCount,
    answers: answersCount,
    total: friendRequestsCount + suggestionsCount + movieNightInvitesCount + answersCount,
  } satisfies TNotificationCount);
}
