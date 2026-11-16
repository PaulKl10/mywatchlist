import { NextResponse } from "next/server";
import { parsePushEndpoint, parsePushSubscriptionInput } from "@/lib/push/validation";
import {
  deletePushSubscription,
  getCurrentSession,
  savePushSubscription,
} from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
}

function invalidBody() {
  return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: NO_STORE });
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Abonne l'appareil courant : corps = `PushSubscription.toJSON()`. */
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return unauthorized();

  const input = parsePushSubscriptionInput(await readBody(request));
  if (!input) return invalidBody();

  await savePushSubscription(session.user.id, input);
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}

/** Désabonne l'appareil courant : corps `{ endpoint }`. */
export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session) return unauthorized();

  const endpoint = parsePushEndpoint(await readBody(request));
  if (!endpoint) return invalidBody();

  await deletePushSubscription(session.user.id, endpoint);
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
