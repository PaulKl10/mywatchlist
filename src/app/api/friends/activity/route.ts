import { NextResponse } from "next/server";
import { getCurrentSession, getFriendsActivity } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Fil d'activité des amis de l'utilisateur connecté (30 derniers jours). */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    const feed = await getFriendsActivity(session.user.id);
    return NextResponse.json(feed, { headers: NO_STORE });
  } catch (error) {
    console.error("[activity] Fil impossible", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Impossible de charger l'activité" },
      { status: 500, headers: NO_STORE }
    );
  }
}
