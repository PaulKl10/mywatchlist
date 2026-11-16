import { NextResponse } from "next/server";
import { parseProviderIds } from "@/lib/movie-night/validation";
import { getCurrentSession, rememberProviders } from "@/lib/server/services";

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

/** Enregistre « mes plateformes » : corps `{ providerIds }` (liste vide acceptée). */
export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const providerIds =
    typeof body === "object" && body !== null && "providerIds" in body
      ? parseProviderIds(body.providerIds)
      : null;
  if (!providerIds) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: NO_STORE });
  }

  await rememberProviders(session.user.id, providerIds);
  return NextResponse.json({ providerIds }, { headers: NO_STORE });
}
