import { NextResponse } from "next/server";
import { CDN_CACHE, publicCachedJson } from "@/lib/server/http";
import { fetchFrenchStreamingProviders } from "@/lib/server/services";
import { tmdbErrorMessage } from "@/lib/tmdb-client";

export async function GET() {
  try {
    return publicCachedJson(await fetchFrenchStreamingProviders(), CDN_CACHE.details);
  } catch (error) {
    console.error("watch-providers: échec TMDB", tmdbErrorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch watch providers from TMDB" },
      { status: 500 }
    );
  }
}
