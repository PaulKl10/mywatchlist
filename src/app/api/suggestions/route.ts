import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserFromSessionId,
  getSuggestions,
  createSuggestion,
  type TSuggestion,
} from "@/lib/server/services";

export type { TSuggestion };

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;
  const user = await getUserFromSessionId(sessionId);

  if (!user) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const suggestions = await getSuggestions(user.id);
  return NextResponse.json({ suggestions });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;
  const user = await getUserFromSessionId(sessionId);

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

  const result = await createSuggestion(user.id, {
    receiverId,
    tmdbMovieId,
    title,
    poster_path,
  });

  if ("success" in result) {
    return NextResponse.json({ success: true });
  }

  switch (result.error) {
    case "receiver_not_found":
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    case "cannot_suggest_to_self":
      return NextResponse.json(
        { error: "Cannot suggest to yourself" },
        { status: 400 }
      );
    case "not_friends":
      return NextResponse.json(
        { error: "Can only suggest to friends" },
        { status: 400 }
      );
    case "already_suggested":
      return NextResponse.json(
        { error: "Already suggested this movie to this friend" },
        { status: 400 }
      );
  }
}
