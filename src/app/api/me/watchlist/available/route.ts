import { NextResponse } from "next/server";
import { getAvailableWatchlistItems, getCurrentSession } from "@/lib/server/services";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Médias de ma watchlist dispo sur mes plateformes : `?media_type=movie|tv`. */
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500, headers: NO_STORE }
    );
  }

  const mediaType = new URL(request.url).searchParams.get("media_type");
  if (mediaType !== "movie" && mediaType !== "tv") {
    return NextResponse.json({ error: "Invalid media_type" }, { status: 400, headers: NO_STORE });
  }

  const providerIds = session.user.streaming_provider_ids;
  try {
    const { items, truncated } = await getAvailableWatchlistItems(
      session.user.id,
      mediaType,
      providerIds
    );
    return NextResponse.json({ items, truncated, providerIds }, { headers: NO_STORE });
  } catch (error) {
    console.error("[watchlist] Filtre par plateformes impossible", tmdbErrorMessage(error));
    return NextResponse.json(
      { error: "Impossible de vérifier les plateformes" },
      { status: 500, headers: NO_STORE }
    );
  }
}
