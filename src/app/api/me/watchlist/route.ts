import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TMeWatchlistItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: {
      user: {
        include: {
          watchlistItems: { orderBy: { added_at: "desc" } },
        },
      },
    },
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const items: TMeWatchlistItem[] = session.user.watchlistItems.map(
    (item) => ({
      id: item.tmdb_movie_id,
      media_type: (item.media_type as "movie" | "tv") || "movie",
      title: item.title,
      poster_path: item.poster_path,
      release_date: item.release_date,
      vote_average: item.vote_average,
      overview: item.overview,
    })
  );

  return NextResponse.json({
    items,
    total: items.length,
  });
}
