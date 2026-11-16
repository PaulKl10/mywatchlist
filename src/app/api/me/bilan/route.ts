import { NextResponse } from "next/server";
import { FIRST_YEARLY_BILAN } from "@/lib/bilan/compute";
import { getBilan, getCurrentSession } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Mon bilan : `?year=AAAA` (à partir de 2027) ou, sans paramètre, depuis toujours. */
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const rawYear = new URL(request.url).searchParams.get("year");
  let year: number | null = null;
  if (rawYear !== null) {
    year = /^\d{4}$/.test(rawYear) ? Number(rawYear) : Number.NaN;
    if (!(year >= FIRST_YEARLY_BILAN && year <= new Date().getUTCFullYear())) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400, headers: NO_STORE });
    }
  }

  try {
    return NextResponse.json(await getBilan(session.user.id, year), { headers: NO_STORE });
  } catch (error) {
    console.error("[bilan] Calcul impossible", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Impossible de calculer le bilan" },
      { status: 500, headers: NO_STORE }
    );
  }
}
