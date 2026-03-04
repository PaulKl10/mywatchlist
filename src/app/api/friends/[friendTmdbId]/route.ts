import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ friendTmdbId: string }> }
) {
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

  const friendTmdbId = parseInt((await params).friendTmdbId, 10);
  if (Number.isNaN(friendTmdbId)) {
    return NextResponse.json({ error: "Invalid friend" }, { status: 400 });
  }

  const friend = await prisma.user.findUnique({
    where: { tmdb_id: friendTmdbId },
  });

  if (!friend) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (friend.id === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: session.user.id, receiverId: friend.id },
        { senderId: friend.id, receiverId: session.user.id },
      ],
    },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 400 });
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  return NextResponse.json({ success: true });
}
