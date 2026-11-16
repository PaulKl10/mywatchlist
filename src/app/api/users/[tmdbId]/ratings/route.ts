import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findAcceptedFriendship, getCurrentSession } from "@/lib/server/services";
import type { TFriendRating } from "@/types/rating.type";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Notes d'un ami (copie en base), les plus récentes d'abord. Visibles uniquement par ses amis. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const { tmdbId } = await params;
  const tmdbIdNum = Number(tmdbId);
  if (!Number.isInteger(tmdbIdNum) || tmdbIdNum <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400, headers: NO_STORE });
  }

  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const profileUser = await prisma.user.findUnique({
    where: { tmdb_id: tmdbIdNum },
    select: { id: true },
  });
  // Même réponse pour un inconnu et un non-ami : ne révèle pas qui utilise l'app.
  const friendship =
    profileUser && (await findAcceptedFriendship(current.user.id, profileUser.id));
  if (!profileUser || !friendship) {
    return NextResponse.json({ error: "Ratings not available" }, { status: 404, headers: NO_STORE });
  }

  const rows = await prisma.ratingItem.findMany({
    where: { userId: profileUser.id },
    // Notes datées (vues par l'app) d'abord ; les notes importées n'ont pas de date.
    orderBy: [{ rated_at: { sort: "desc", nulls: "last" } }, { rating: "desc" }],
  });

  const items: TFriendRating[] = rows.map((row) => ({
    id: row.tmdb_id,
    mediaType: row.media_type === "tv" ? "tv" : "movie",
    title: row.title,
    posterPath: row.poster_path,
    releaseDate: row.release_date,
    rating: row.rating,
  }));
  return NextResponse.json({ items }, { headers: NO_STORE });
}
