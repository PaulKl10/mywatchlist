import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAcceptedFriendship,
  getCurrentSession,
  getWatchTimeStats,
  type TWatchTimeStats,
} from "@/lib/server/services";

export type TWatchTimeResponse = TWatchTimeStats;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const { tmdbId } = await params;
  const tmdbIdNum = parseInt(tmdbId, 10);
  if (Number.isNaN(tmdbIdNum)) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profileUser = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
  });

  if (!profileUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Visible uniquement par les amis
  const friendship = await findAcceptedFriendship(current.user.id, profileUser.id);
  if (!friendship) {
    return NextResponse.json(
      { error: "Temps de visionnage non disponible" },
      { status: 404 }
    );
  }

  const stats: TWatchTimeResponse = await getWatchTimeStats(profileUser.id);
  return NextResponse.json(stats);
}
