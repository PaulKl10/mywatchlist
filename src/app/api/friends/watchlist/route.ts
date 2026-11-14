import { NextResponse } from "next/server";
import {
  getCurrentSession,
  getFriendsWatchlistMovies,
} from "@/lib/server/services";

export async function GET() {
  const current = await getCurrentSession();
  const movies = current ? await getFriendsWatchlistMovies(current.user.id) : [];
  return NextResponse.json({ movies }, { status: 200 });
}
