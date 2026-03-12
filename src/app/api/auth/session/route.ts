import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { tmdbClient } from "@/lib/tmdb-client";

type TMDBAccount = {
  id: number;
  username: string;
  name: string | null;
  avatar: {
    gravatar: { hash: string };
    tmdb: { avatar_path: string | null };
  };
};

export async function POST() {
  const cookieStore = await cookies();

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const requestToken = cookieStore.get("tmdb_request_token")?.value;

  if (!requestToken) {
    return NextResponse.json(
      { error: "Request token not found" },
      { status: 400 }
    );
  }

  try {
    const sessionData = await tmdbClient.post<{ session_id: string }>(
      "/authentication/session/new",
      { request_token: requestToken }
    );

    const sessionId = sessionData.session_id;

    const account = await tmdbClient.get<TMDBAccount>("/account", {
      session_id: sessionId,
    });

    const gravatarHash = account.avatar?.gravatar?.hash?.trim() || null;
    const tmdbAvatarPath = account.avatar?.tmdb?.avatar_path?.trim() || null;

    const user = await prisma.user.upsert({
      where: { tmdb_id: account.id },
      create: {
        tmdb_id: account.id,
        username: (account.username || account.name) ?? null,
        gravatar_hash: gravatarHash,
        tmdb_avatar_path: tmdbAvatarPath,
      },
      update: {
        username: (account.username || account.name) ?? null,
        gravatar_hash: gravatarHash,
        tmdb_avatar_path: tmdbAvatarPath,
      },
    });

    await prisma.session.upsert({
      where: { tmdb_session_id: sessionId },
      create: { tmdb_session_id: sessionId, userId: user.id },
      update: { userId: user.id },
    });

    const response = NextResponse.json({
      success: true,
      session_id: sessionId,
    });

    response.cookies.set("tmdb_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    cookieStore.delete("tmdb_request_token");

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
