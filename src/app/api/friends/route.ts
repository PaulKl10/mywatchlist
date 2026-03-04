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

  const friends = friendships.map((f) => {
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
