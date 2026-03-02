import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (sessionId) {
    await prisma.session.deleteMany({
      where: { tmdb_session_id: sessionId },
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("tmdb_session_id");
  return response;
}
