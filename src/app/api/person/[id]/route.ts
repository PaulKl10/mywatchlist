import { NextResponse } from "next/server";
import axios from "axios";
import type { TPersonDetails } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
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
    const { data } = await axios.get(
      `${TMDB_BASE_URL}/person/${id}`,
      {
        params: { api_key: apiKey, language: "fr-FR" },
      }
    );

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
