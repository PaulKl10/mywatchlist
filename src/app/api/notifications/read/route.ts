import { NextResponse } from "next/server";
import { getCurrentSession, markNotificationsRead } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Marque comme lues les notifications enregistrées jusqu'à `{ until }` (ISO 8601) inclus. */
export async function POST(request: Request) {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  let body: { until?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: NO_STORE });
  }
  const until = typeof body?.until === "string" ? new Date(body.until) : null;
  if (!until || Number.isNaN(until.getTime())) {
    return NextResponse.json({ error: "until (ISO 8601) requis" }, { status: 400, headers: NO_STORE });
  }

  try {
    const now = new Date();
    // Jamais au-delà de maintenant : une date future marquerait les notifications à venir.
    await markNotificationsRead(current.user.id, until > now ? now : until, now);
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("[notifications] Marquage impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: NO_STORE });
  }
}
