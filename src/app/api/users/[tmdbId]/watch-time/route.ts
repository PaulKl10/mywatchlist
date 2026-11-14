import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getWatchTimeStats, type TWatchTimeStats } from "@/lib/server/services";

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

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profileUser = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
  });

  if (!profileUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Vérifier si l'utilisateur connecté est ami avec le profil
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: session.user.id, receiverId: profileUser.id },
        { senderId: profileUser.id, receiverId: session.user.id },
      ],
    },
  });

  if (!friendship) {
    return NextResponse.json(
      { error: "Temps de visionnage non disponible" },
      { status: 404 }
    );
  }

  const stats: TWatchTimeResponse = await getWatchTimeStats(profileUser.id);
  return NextResponse.json(stats);
}
