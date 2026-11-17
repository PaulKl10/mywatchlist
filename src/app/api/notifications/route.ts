import { NextResponse } from "next/server";
import { getCurrentSession, listNotifications } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Notifications du panneau de l'en-tête → `{ items: TNotificationItem[] }`. */
export async function GET() {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const items = await listNotifications(current.user.id);
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (error) {
    console.error("[notifications] Lecture impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: NO_STORE });
  }
}
