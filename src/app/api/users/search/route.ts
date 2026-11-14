import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/server/services";

export type TSearchUser = {
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tmdbIdNum = parseInt(q, 10);
  const isNumeric = /^\d+$/.test(q) && !Number.isNaN(tmdbIdNum);
  const users = await prisma.user.findMany({
    where: {
      id: { not: current.user.id },
      ...(isNumeric
        ? { tmdb_id: tmdbIdNum }
        : {
            username: {
              contains: q,
              mode: "insensitive",
            },
          }),
    },
    take: 10,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      tmdb_id: u.tmdb_id,
      username: u.username,
      gravatar_hash: u.gravatar_hash,
      tmdb_avatar_path: u.tmdb_avatar_path,
    } satisfies TSearchUser)),
  });
}
