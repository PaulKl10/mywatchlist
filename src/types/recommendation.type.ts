import type { TDiscoverTv, TMovie } from "./movie.type";

/** Rangée « Parce que tu as aimé X » de l'accueil. */
export type TRecommendationRow =
  | { mediaType: "movie"; seedId: number; seedTitle: string; movies: TMovie[] }
  | { mediaType: "tv"; seedId: number; seedTitle: string; tvShows: TDiscoverTv[] };
