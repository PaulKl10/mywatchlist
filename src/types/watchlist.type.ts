import type { TMediaType } from "./movie.type";

/** Média de la watchlist dispo sur une des plateformes de l'utilisateur. */
export type TAvailableWatchlistItem = {
  id: number;
  media_type: TMediaType;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
  /** Plateforme choisie qui le propose en abonnement (la plus prioritaire). */
  provider: { id: number; name: string; logoPath: string | null };
};
