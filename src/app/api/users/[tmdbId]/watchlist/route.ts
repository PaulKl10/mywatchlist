import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TPublicWatchlistItem = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
};

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileUser = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
    include: { watchlistItems: { orderBy: { added_at: "desc" } } },
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
    return NextResponse.json({ error: "Watchlist not available" }, { status: 404 });
  }

  const user = profileUser;

  const items: TPublicWatchlistItem[] = user.watchlistItems.map((item: (typeof user.watchlistItems)[number]) => ({
    id: item.tmdb_movie_id,
    title: item.title,
    poster_path: item.poster_path,
    release_date: item.release_date ?? "",
    vote_average: item.vote_average ?? 0,
    overview: item.overview ?? "",
  }));

  return NextResponse.json({ watchlist: items });
}
