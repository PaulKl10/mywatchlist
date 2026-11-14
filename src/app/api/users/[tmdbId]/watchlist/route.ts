import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAcceptedFriendship,
  getCurrentSession,
} from "@/lib/server/services";

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

  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Watchlist not available" }, { status: 404 });
  }

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { userId: profileUser.id },
    orderBy: { added_at: "desc" },
  });

  const items: TPublicWatchlistItem[] = watchlistItems.map((item) => ({
    id: item.tmdb_movie_id,
    title: item.title,
    poster_path: item.poster_path,
    release_date: item.release_date ?? "",
    vote_average: item.vote_average ?? 0,
    overview: item.overview ?? "",
  }));

  return NextResponse.json({ watchlist: items });
}
