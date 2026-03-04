import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TFriendRequest = {
  id: string;
  sender: {
    id: string;
    tmdb_id: number;
    username: string | null;
    gravatar_hash: string | null;
    tmdb_avatar_path: string | null;
  };
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ requests: [] }, { status: 200 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) {
    return NextResponse.json({ requests: [] }, { status: 200 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      receiverId: session.user.id,
      status: "PENDING",
    },
    include: { sender: true },
  });

  const requests: TFriendRequest[] = friendships.map((f: (typeof friendships)[number]) => ({
    id: f.id,
    sender: {
      id: f.sender.id,
      tmdb_id: f.sender.tmdb_id,
      username: f.sender.username,
      gravatar_hash: f.sender.gravatar_hash,
      tmdb_avatar_path: f.sender.tmdb_avatar_path,
    },
  }));

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
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

  let body: { friendshipId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { friendshipId, action } = body;
  if (typeof friendshipId !== "string" || !["accept", "decline"].includes(action ?? "")) {
    return NextResponse.json(
      { error: "friendshipId and action (accept|decline) required" },
      { status: 400 }
    );
  }

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (friendship.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  if (action === "accept") {
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED" },
    });
  } else {
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  return NextResponse.json({ success: true });
}
