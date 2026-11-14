import { NextResponse } from "next/server";
import {
  getCurrentSession,
  getWatchTimeStats,
  type TWatchTimeStats,
} from "@/lib/server/services";

export type TWatchTimeResponse = TWatchTimeStats;

export async function GET() {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const stats: TWatchTimeResponse = await getWatchTimeStats(current.user.id);
  return NextResponse.json(stats);
}
