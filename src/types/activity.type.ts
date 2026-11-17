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
  /** « J'aime » des amis de l'auteur. */
  likeCount: number;
  likedByMe: boolean;
  user: { tmdbId: number; name: string; avatarUrl: string | null };
};
