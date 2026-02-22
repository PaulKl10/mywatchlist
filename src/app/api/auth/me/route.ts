import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TAccount = {
  id: number;
  username: string;
  name: string | null;
  avatar: { gravatar: { hash: string }; tmdb: { avatar_path: string | null } };
};

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const { data } = await axios.get<TAccount>(`${TMDB_BASE_URL}/account`, {
      params: { api_key: apiKey, session_id: sessionId },
    });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
