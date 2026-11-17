import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession, getFriendsRatingsForTitle } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Notes des amis sur un titre : `?media_type=movie|tv&tmdb_id=123`
 * → `{ items: TFriendTitleRating[] }`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mediaType = searchParams.get("media_type");
  const tmdbId = Number(searchParams.get("tmdb_id"));
  if ((mediaType !== "movie" && mediaType !== "tv") || !Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json(
      { error: "media_type (movie|tv) et tmdb_id requis" },
      { status: 400, headers: NO_STORE }
    );
  }

  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const items = await getFriendsRatingsForTitle(current.user.id, mediaType, tmdbId);
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (error) {
    console.error(
      "[friends] Notes des amis illisibles",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: NO_STORE });
  }
}
