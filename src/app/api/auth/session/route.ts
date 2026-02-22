import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function POST(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();

  if (!apiKey) {
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
    const { data } = await axios.post(
      `${TMDB_BASE_URL}/authentication/session/new`,
      { request_token: requestToken },
      {
        params: { api_key: apiKey },
        headers: { "Content-Type": "application/json" },
      }
    );

    const response = NextResponse.json({
      success: true,
      session_id: data.session_id,
    });

    response.cookies.set("tmdb_session_id", data.session_id, {
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
