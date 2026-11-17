import { NextResponse } from "next/server";
import { parseReaction, type TReaction } from "@/lib/activity/reactions";
import { getCurrentSession, setActivityReaction } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

type TRouteContext = { params: Promise<{ id: string }> };

/** Identifiant cuid d'un événement du fil. */
const ACTIVITY_ID = /^[a-z0-9]{20,40}$/;

async function handle(id: string, reaction: TReaction | null) {
  if (!ACTIVITY_ID.test(id)) {
    return NextResponse.json({ error: "Invalid activity" }, { status: 400, headers: NO_STORE });
  }
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const result = await setActivityReaction(current.user.id, id, reaction);
    if (!result.ok) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(
      { reaction: result.reaction, counts: result.counts },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("[activity] Réaction impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: NO_STORE });
  }
}

/** Réagit à l'événement d'un ami : `{ reaction: "LIKE" | "LAUGH" | "DISLIKE" }` → `{ reaction, counts }`. */
export async function PUT(request: Request, { params }: TRouteContext) {
  const { id } = await params;
  let body: { reaction?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: NO_STORE });
  }
  const reaction = parseReaction(body?.reaction);
  if (!reaction) {
    return NextResponse.json(
      { error: "reaction (LIKE|LAUGH|DISLIKE) requise" },
      { status: 400, headers: NO_STORE }
    );
  }
  return handle(id, reaction);
}

/** Retire ma réaction → `{ reaction: null, counts }`. */
export async function DELETE(_request: Request, { params }: TRouteContext) {
  return handle((await params).id, null);
}
