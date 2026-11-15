import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ providerIds: [] }, { headers: NO_STORE });
  }
  return NextResponse.json(
    { providerIds: session.user.streaming_provider_ids },
    { headers: NO_STORE }
  );
}
