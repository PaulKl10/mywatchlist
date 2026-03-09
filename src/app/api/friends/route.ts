import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFriends, addFriend, type TFriend } from "@/lib/server/services";

export type { TFriend };

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  const friends = await getFriends(sessionId);
  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  let body: { receiverTmdbId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const receiverTmdbId = body.receiverTmdbId;
  if (typeof receiverTmdbId !== "number") {
    return NextResponse.json(
      { error: "receiverTmdbId required" },
      { status: 400 }
    );
  }

  const result = await addFriend(sessionId, receiverTmdbId);

  if ("success" in result) {
    return NextResponse.json({ success: true });
  }

  switch (result.error) {
    case "unauthorized":
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    case "user_not_found":
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    case "cannot_add_self":
      return NextResponse.json(
        { error: "Cannot add yourself" },
        { status: 400 }
      );
    case "request_already_sent":
      return NextResponse.json(
        { error: "Request already sent" },
        { status: 400 }
      );
    case "they_sent_you_request":
      return NextResponse.json(
        { error: "They already sent you a request" },
        { status: 400 }
      );
    case "already_friends":
      return NextResponse.json(
        { error: "Already friends" },
        { status: 400 }
      );
  }
}
