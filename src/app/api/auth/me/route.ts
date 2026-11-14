import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server/services";

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
  const current = await getCurrentSession();

  if (!current) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: toAccount(current.user) });
}
