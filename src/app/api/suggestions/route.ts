import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TSuggestion = {
  id: string;
  tmdb_movie_id: number;
  title: string;
  poster_path: string | null;
  sender: {
    tmdb_id: number;
    username: string | null;
  };
  createdAt: string;
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
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const suggestions = await prisma.suggestion.findMany({
    where: { toUserId: user.id },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });

  const result: TSuggestion[] = suggestions.map((s: (typeof suggestions)[number]) => ({
    id: s.id,
    tmdb_movie_id: s.tmdb_movie_id,
    title: s.title,
    poster_path: s.poster_path,
    sender: {
      tmdb_id: s.sender.tmdb_id,
      username: s.sender.username,
    },
    createdAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json({ suggestions: result });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    receiverId?: string;
    tmdbMovieId?: number;
    title?: string;
    poster_path?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { receiverId, tmdbMovieId, title, poster_path } = body;
  if (
    typeof receiverId !== "string" ||
    typeof tmdbMovieId !== "number" ||
    typeof title !== "string"
  ) {
    return NextResponse.json(
      { error: "receiverId, tmdbMovieId et title requis" },
      { status: 400 }
    );
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (receiver.id === user.id) {
    return NextResponse.json(
      { error: "Cannot suggest to yourself" },
      { status: 400 }
    );
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: user.id, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: user.id },
      ],
    },
  });
  if (!friendship) {
    return NextResponse.json(
      { error: "Can only suggest to friends" },
      { status: 400 }
    );
  }

  const existing = await prisma.suggestion.findFirst({
    where: {
      fromUserId: user.id,
      toUserId: receiver.id,
      tmdb_movie_id: tmdbMovieId,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already suggested this movie to this friend" },
      { status: 400 }
    );
  }

  await prisma.suggestion.create({
    data: {
      fromUserId: user.id,
      toUserId: receiver.id,
      tmdb_movie_id: tmdbMovieId,
      title,
      poster_path:
        typeof poster_path === "string" || poster_path === null
          ? poster_path
          : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
