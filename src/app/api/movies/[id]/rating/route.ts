import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  let body: { value: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const { value } = body;
  if (
    typeof value !== "number" ||
    value < 0.5 ||
    value > 10 ||
    (value * 2) % 1 !== 0
  ) {
    return NextResponse.json(
      { error: "La note doit être entre 0.5 et 10 (par paliers de 0.5)" },
      { status: 400 }
    );
  }

  try {
    await axios.post(
      `${TMDB_BASE_URL}/movie/${id}/rating`,
      { value },
      {
        params: { api_key: apiKey, session_id: sessionId },
        headers: { "Content-Type": "application/json" },
      }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'ajouter la note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  try {
    await axios.delete(
      `${TMDB_BASE_URL}/movie/${id}/rating`,
      {
        params: { api_key: apiKey, session_id: sessionId },
      }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer la note" },
      { status: 500 }
    );
  }
}
