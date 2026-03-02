import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TAccount = {
  id: number;
  username: string;
  name: string | null;
  avatar: { gravatar: { hash: string }; tmdb: { avatar_path: string | null } };
};

function toAccount(user: {
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
}): TAccount {
  const gravatarHash = user.gravatar_hash?.trim();
  const tmdbAvatarPath = user.tmdb_avatar_path?.trim();
  return {
    id: user.tmdb_id,
    username: user.username ?? "",
    name: user.username ?? null,
    avatar: {
      gravatar: { hash: gravatarHash || "" },
      tmdb: { avatar_path: tmdbAvatarPath || null },
    },
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: toAccount(session.user) });
}
