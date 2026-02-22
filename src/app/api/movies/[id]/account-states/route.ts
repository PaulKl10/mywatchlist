import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TAccountStates = {
  watchlist: boolean;
  favorite: boolean;
  rated: boolean | { value: number };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json(
      { watchlist: false, favorite: false, rated: false },
      { status: 200 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  try {
    const { data } = await axios.get<TAccountStates>(
      `${TMDB_BASE_URL}/movie/${id}/account_states`,
      {
        params: { api_key: apiKey, session_id: sessionId },
      }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { watchlist: false, favorite: false, rated: false },
      { status: 200 }
    );
  }
}
