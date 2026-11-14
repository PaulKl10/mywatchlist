import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAcceptedFriendship,
  getCurrentSession,
} from "@/lib/server/services";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ friendTmdbId: string }> }
) {
  const current = await getCurrentSession();
  if (!current) {
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

  if (friend.id === current.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const friendship = await findAcceptedFriendship(current.user.id, friend.id);
  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 400 });
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  return NextResponse.json({ success: true });
}
