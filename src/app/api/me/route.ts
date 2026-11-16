import { NextResponse } from "next/server";
import { SESSION_COOKIE, deleteUserAccount, getCurrentSession } from "@/lib/server/services";
import { tmdbErrorMessage } from "@/lib/tmdb-client";

const NO_STORE = { "Cache-Control": "no-store" };

/** Supprime le compte My Watchlist de l'utilisateur connecté et toutes ses données. */
export async function DELETE() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    await deleteUserAccount(session.user.id);
  } catch (error) {
    console.error("[account] Suppression du compte impossible", tmdbErrorMessage(error));
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500, headers: NO_STORE }
    );
  }

  const response = new NextResponse(null, { status: 204, headers: NO_STORE });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
