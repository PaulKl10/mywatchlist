import { prisma } from "@/lib/prisma";
import { tmdbErrorMessage } from "@/lib/tmdb-client";
import { revokeTmdbSession } from "./session.service";

/**
 * Supprime l'utilisateur et toutes ses données My Watchlist. Le compte TMDB, sa watchlist
 * et ses notes ne sont pas touchés.
 *
 * Amitiés et suggestions n'ont pas de suppression en cascade : elles sont effacées dans la
 * même transaction. Le reste part en cascade avec l'utilisateur : sessions, copie de la
 * watchlist, temps de visionnage, abonnements push, soirées hébergées (avec leurs participants
 * et votes) et participations aux soirées des autres.
 *
 * Toutes les sessions TMDB du compte (un par appareil) sont ensuite révoquées, en best effort :
 * les données sont déjà supprimées et l'échec d'un appel TMDB ne doit pas l'annuler.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const sessionIds = await prisma.$transaction(async (tx) => {
    const sessions = await tx.session.findMany({
      where: { userId },
      select: { tmdb_session_id: true },
    });
    await tx.friendship.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await tx.suggestion.deleteMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    });
    await tx.user.delete({ where: { id: userId } });
    return sessions.map((session) => session.tmdb_session_id);
  });

  const results = await Promise.allSettled(sessionIds.map(revokeTmdbSession));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "[account] Révocation d'une session TMDB impossible",
        tmdbErrorMessage(result.reason)
      );
    }
  }
}
