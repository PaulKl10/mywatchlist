import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runAvailabilityCheck } from "@/lib/server/services";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";

/** Le passage lit TMDB titre par titre : jusqu'à une minute. */
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

/** Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` (variable d'environnement du projet). */
function isAuthorized(request: Request, secret: string): boolean {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Passage quotidien de l'alerte « enfin dispo » (voir vercel.json). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503, headers: NO_STORE });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  if (!tmdbClient.isConfigured()) {
    return NextResponse.json({ error: "TMDB_API_KEY is not configured" }, { status: 500, headers: NO_STORE });
  }

  try {
    const summary = await runAvailabilityCheck();
    return NextResponse.json(summary, { headers: NO_STORE });
  } catch (error) {
    console.error("[availability] Passage impossible", tmdbErrorMessage(error));
    return NextResponse.json({ error: "Availability check failed" }, { status: 500, headers: NO_STORE });
  }
}
