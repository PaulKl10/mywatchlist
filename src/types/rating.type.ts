import type { TMediaType } from "./movie.type";

/** Note d'un ami, affichée sur son profil. */
export type TFriendRating = {
  id: number;
  mediaType: TMediaType;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  /** Sur 10. */
  rating: number;
};

/** Note d'un ami sur un titre, affichée sur la fiche du film ou de la série. */
export type TFriendTitleRating = {
  user: { tmdbId: number; name: string; avatarUrl: string | null };
  /** Sur 10. */
  rating: number;
};
