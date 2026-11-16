/**
 * Plateformes de streaming mémorisées dans le navigateur pour les visiteurs sans compte
 * (les connectés les retrouvent dans leur profil). Lecture pure (testée) + enveloppes
 * `localStorage` qui ne lèvent jamais.
 */
export const REMEMBERED_PROVIDERS_KEY = "movie-night-providers";

const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

/** Ids relus depuis le stockage ; [] si absents, illisibles ou invalides. */
export function readRememberedProviderIds(raw: string | null): number[] {
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  return Array.isArray(data) && data.every(isId) ? data : [];
}

export function loadRememberedProviderIds(): number[] {
  try {
    return readRememberedProviderIds(localStorage.getItem(REMEMBERED_PROVIDERS_KEY));
  } catch {
    return []; // stockage bloqué, ou rendu serveur
  }
}

export function saveRememberedProviderIds(ids: number[]): void {
  try {
    localStorage.setItem(REMEMBERED_PROVIDERS_KEY, JSON.stringify(ids));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la sélection n'est pas mémorisée.
  }
}
