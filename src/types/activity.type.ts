import type { TReaction, TReactionCounts } from "@/lib/activity/reactions";
import type { TMediaType } from "./movie.type";

export type TActivityType = "RATED" | "WATCHLIST_ADDED";

/** Événement du fil d'activité des amis. */
export type TActivityItem = {
  id: string;
  type: TActivityType;
  mediaType: TMediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  /** Note sur 10, pour RATED. */
  rating: number | null;
  /** ISO 8601. */
  createdAt: string;
  /** Réactions des amis de l'auteur, par type. */
  reactions: TReactionCounts;
  /** Ma réaction, une au plus. */
  myReaction: TReaction | null;
  user: { tmdbId: number; name: string; avatarUrl: string | null };
};
