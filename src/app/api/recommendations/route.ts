import { NextResponse } from "next/server";
import { getCurrentSession, getRecommendationRows } from "@/lib/server/services";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Rangées « Parce que tu as aimé X » de l'utilisateur connecté. */
export async function GET() {
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

  try {
    const rows = await getRecommendationRows(session);
    return NextResponse.json({ rows }, { headers: NO_STORE });
  } catch (error) {
    console.error("[recommendations] Rangées impossibles", tmdbErrorMessage(error));
    return NextResponse.json(
      { error: "Impossible de charger les recommandations" },
      { status: 500, headers: NO_STORE }
    );
  }
}
