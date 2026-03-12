import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tmdbClient } from "@/lib/tmdb-client";

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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { watchlist: false, favorite: false, rated: false },
      { status: 200 }
    );
  }

  if (!tmdbClient.isConfigured()) {
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
    const data = await tmdbClient.get<TAccountStates>(
      `/movie/${id}/account_states`,
      { session_id: sessionId }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { watchlist: false, favorite: false, rated: false },
      { status: 200 }
    );
  }
}
