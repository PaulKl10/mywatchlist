import { MovieNightApiError } from "../services/movie-night.service";

/**
 * Décision (« On regarde ça », « Continuer ») ou « Nouvelle pile » refusée parce que l'écran
 * est en retard sur le serveur : un autre participant a déjà tranché ou relancé la pile
 * (`wrong_status`), ou l'hôte est revenu et la décision lui revient (`forbidden`). On
 * resynchronise sans afficher d'erreur : le prochain état fait foi.
 */
export function isStaleDecisionError(error: unknown): boolean {
  return (
    error instanceof MovieNightApiError &&
    (error.code === "wrong_status" || error.code === "forbidden")
  );
}

/** Message d'une erreur de décision à afficher, ou null si elle est périmée. */
export function decisionErrorMessage(error: Error | null): string | null {
  return error && !isStaleDecisionError(error) ? error.message : null;
}
