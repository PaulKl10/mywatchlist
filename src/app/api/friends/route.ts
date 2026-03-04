import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TFriend = {
  id: string;
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ friends: [] }, { status: 200 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) {
    return NextResponse.json({ friends: [] }, { status: 200 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
  });

  const friends = friendships.map((f: (typeof friendships)[number]) => {
    const friend = f.senderId === session.user.id ? f.receiver : f.sender;
    return {
      id: friend.id,
      tmdb_id: friend.tmdb_id,
      username: friend.username,
      gravatar_hash: friend.gravatar_hash,
      tmdb_avatar_path: friend.tmdb_avatar_path,
    } satisfies TFriend;
  });

  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
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

  let body: { receiverTmdbId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const receiverTmdbId = body.receiverTmdbId;
  if (typeof receiverTmdbId !== "number") {
    return NextResponse.json({ error: "receiverTmdbId required" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { tmdb_id: receiverTmdbId },
  });

  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (receiver.id === session.user.id) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const existing = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId: session.user.id,
        receiverId: receiver.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: existing.status === "PENDING" ? "Request already sent" : "Already friends" },
      { status: 400 }
    );
  }

  const reverseExisting = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId: receiver.id,
        receiverId: session.user.id,
      },
    },
  });

  if (reverseExisting) {
    return NextResponse.json(
      { error: reverseExisting.status === "PENDING" ? "They already sent you a request" : "Already friends" },
      { status: 400 }
    );
  }

  await prisma.friendship.create({
    data: {
      senderId: session.user.id,
      receiverId: receiver.id,
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true });
}
