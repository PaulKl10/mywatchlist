import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/services";
import type { TMediaType } from "@/types/movie.type";

export type TMeWatchlistItem = {
  id: number;
  media_type: TMediaType;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
};

export async function GET() {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { userId: current.user.id },
    orderBy: { added_at: "desc" },
  });

  const items: TMeWatchlistItem[] = watchlistItems.map((item) => ({
    id: item.tmdb_movie_id,
    media_type: item.media_type === "tv" ? "tv" : "movie",
    title: item.title,
    poster_path: item.poster_path,
    release_date: item.release_date,
    vote_average: item.vote_average,
    overview: item.overview,
  }));

  return NextResponse.json({
    items,
    total: items.length,
  });
}
