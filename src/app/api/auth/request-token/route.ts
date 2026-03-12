import { NextResponse } from "next/server";
import { tmdbClient } from "@/lib/tmdb-client";

export async function POST(request: Request) {
  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const data = await tmdbClient.get<{ request_token: string }>(
      "/authentication/token/new"
    );

    const requestToken = data.request_token;
    const baseUrl =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const redirectUrl = `${baseUrl.replace(/\/$/, "")}/login/callback`;
    const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${encodeURIComponent(redirectUrl)}`;

    const response = NextResponse.json({
      request_token: requestToken,
      auth_url: authUrl,
    });

    response.cookies.set("tmdb_request_token", requestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to create request token" },
      { status: 500 }
    );
  }
}
