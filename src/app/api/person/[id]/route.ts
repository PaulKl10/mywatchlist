import { NextResponse } from "next/server";
import type { TPersonDetails } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid person ID" },
      { status: 400 }
    );
  }

  try {
    const data = await tmdbClient.get<{
      id: number;
      name: string;
      profile_path: string | null;
      biography: string | null;
    }>(`/person/${id}`, { language: "fr-FR" });

    const response: TPersonDetails = {
      id: data.id,
      name: data.name,
      profile_path: data.profile_path ?? null,
      biography: data.biography ?? null,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch person details from TMDB" },
      { status: 500 }
    );
  }
}
