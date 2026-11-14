import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/server/services";
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
  const sessionId = await getSessionId();

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
