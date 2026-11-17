import { prisma } from "@/lib/prisma";
import type { TMediaType } from "@/types/movie.type";
import type { TFriendTitleRating } from "@/types/rating.type";
import { getFriendIds } from "./friends.service";
import { USER_DISPLAY_SELECT, userAvatarUrl, userDisplayName } from "./movieNightState";

/** Amis affichés au plus sur la fiche d'un titre. */
const MAX_FRIENDS = 50;

/**
 * Notes données à un titre par les amis de l'utilisateur (copies en base, comme sur leur
 * profil), de la meilleure à la moins bonne.
 */
export async function getFriendsRatingsForTitle(
  userId: string,
  mediaType: TMediaType,
  tmdbId: number
): Promise<TFriendTitleRating[]> {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];

  const rows = await prisma.ratingItem.findMany({
    where: { userId: { in: friendIds }, media_type: mediaType, tmdb_id: tmdbId },
    orderBy: { rating: "desc" },
    take: MAX_FRIENDS,
    select: { rating: true, user: { select: USER_DISPLAY_SELECT } },
  });

  return rows.map((row) => ({
    user: {
      tmdbId: row.user.tmdb_id,
      name: userDisplayName(row.user),
      avatarUrl: userAvatarUrl(row.user),
    },
    rating: row.rating,
  }));
}
