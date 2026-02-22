import { NextResponse } from "next/server";
import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function POST(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { data } = await axios.get(
      `${TMDB_BASE_URL}/authentication/token/new`,
      { params: { api_key: apiKey } }
    );

    const requestToken = data.request_token;
    const redirectTo = request.headers.get("origin") || "http://localhost:3000";
    const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${redirectTo}/login/callback`;

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
