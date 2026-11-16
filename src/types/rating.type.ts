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
