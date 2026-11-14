import { NextResponse } from "next/server";
import {
  addFriend,
  getCurrentSession,
  getFriends,
  type TFriend,
} from "@/lib/server/services";

export type { TFriend };

export async function GET() {
  const current = await getCurrentSession();
  const friends = current ? await getFriends(current.user.id) : [];
  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { receiverTmdbId?: unknown };
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

  const result = await addFriend(current.user.id, receiverTmdbId);

  if ("success" in result) {
    return NextResponse.json({ success: true });
  }

  switch (result.error) {
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
