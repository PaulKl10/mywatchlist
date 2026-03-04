import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type TUserProfile = {
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const { tmdbId } = await params;
  const tmdbIdNum = parseInt(tmdbId, 10);
  if (Number.isNaN(tmdbIdNum)) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    tmdb_id: user.tmdb_id,
    username: user.username,
    gravatar_hash: user.gravatar_hash,
    tmdb_avatar_path: user.tmdb_avatar_path,
  });
}
