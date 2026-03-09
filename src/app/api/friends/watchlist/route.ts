import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFriendsWatchlistMovies } from "@/lib/server/services";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  const movies = await getFriendsWatchlistMovies(sessionId);
  return NextResponse.json({ movies }, { status: 200 });
}
