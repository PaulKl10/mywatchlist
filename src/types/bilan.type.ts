import type { TBilanStats } from "@/lib/bilan/compute";

/** Réponse de GET /api/me/bilan. */
export type TBilanResponse = {
  /** null : depuis toujours. */
  year: number | null;
  /** Années disponibles pour un bilan annuel, de la plus récente à la plus ancienne. */
  availableYears: number[];
  stats: TBilanStats;
};
