import { NextResponse } from "next/server";
import { getCurrentSession, setActivityLike } from "@/lib/server/services";

const NO_STORE = { "Cache-Control": "private, no-store" };

type TRouteContext = { params: Promise<{ id: string }> };

/** Identifiant cuid d'un événement du fil. */
const ACTIVITY_ID = /^[a-z0-9]{20,40}$/;

async function handle(id: string, liked: boolean) {
  if (!ACTIVITY_ID.test(id)) {
    return NextResponse.json({ error: "Invalid activity" }, { status: 400, headers: NO_STORE });
  }
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const result = await setActivityLike(current.user.id, id, liked);
    if (!result.ok) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(
      { liked: result.liked, likeCount: result.likeCount },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("[activity] J'aime impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: NO_STORE });
  }
}

/** « J'aime » sur l'événement d'un ami → `{ liked, likeCount }`. */
export async function PUT(_request: Request, { params }: TRouteContext) {
  return handle((await params).id, true);
}

/** Retire le « J'aime » → `{ liked, likeCount }`. */
export async function DELETE(_request: Request, { params }: TRouteContext) {
  return handle((await params).id, false);
}
