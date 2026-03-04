import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { TMovie } from "@/types/movie.type";

function watchlistItemToMovie(item: {
  tmdb_movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
}): TMovie {
  return {
    id: item.tmdb_movie_id,
    title: item.title,
    adult: false,
    backdrop_path: "",
    genre_ids: [],
    original_language: "fr",
    original_title: item.title,
    overview: item.overview ?? "",
    popularity: 0,
    poster_path: item.poster_path,
    release_date: item.release_date ?? "",
    video: false,
    vote_average: item.vote_average ?? 0,
    vote_count: 0,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ movies: [] }, { status: 200 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) {
    return NextResponse.json({ movies: [] }, { status: 200 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
  });

  const friendIds = friendships.map((f: (typeof friendships)[number]) =>
    f.senderId === session.user!.id ? f.receiverId : f.senderId
  );

  if (friendIds.length === 0) {
    return NextResponse.json({ movies: [] }, { status: 200 });
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: { in: friendIds } },
    orderBy: { added_at: "desc" },
  });

  const seen = new Set<number>();
  const movies: TMovie[] = [];
  for (const item of items) {
    if (seen.has(item.tmdb_movie_id)) continue;
    seen.add(item.tmdb_movie_id);
    movies.push(watchlistItemToMovie(item));
  }

  for (let i = movies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [movies[i], movies[j]] = [movies[j], movies[i]];
  }

  return NextResponse.json({ movies: movies.slice(0, 30) });
}
