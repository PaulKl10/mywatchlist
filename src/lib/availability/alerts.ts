import type { TMediaType } from "@/types/movie.type";

/** Plateformes apparues depuis le relevé précédent ; aucune au premier relevé (simple référence). */
export function newProviderIds(before: number[] | null, now: number[]): number[] {
  if (before === null) return [];
  const known = new Set(before);
  return now.filter((id) => !known.has(id));
}

export type TAvailabilityChange = {
  mediaType: TMediaType;
  tmdbId: number;
  newProviderIds: number[];
};

/** Titre de la watchlist d'un utilisateur, avec ses plateformes. */
export type TAvailabilityWatcher = {
  userId: string;
  providerIds: number[];
  mediaType: TMediaType;
  tmdbId: number;
  title: string;
};

export type TAvailabilityAlert = {
  mediaType: TMediaType;
  tmdbId: number;
  title: string;
  providerName: string;
};

const keyOf = (mediaType: TMediaType, tmdbId: number) => `${mediaType}:${tmdbId}`;

/**
 * Alertes par utilisateur : titres de sa watchlist arrivés sur une de ses plateformes.
 * La plateforme nommée est la première arrivée parmi les siennes.
 */
export function planAvailabilityAlerts(
  changes: TAvailabilityChange[],
  watchers: TAvailabilityWatcher[],
  providerNames: ReadonlyMap<number, string>
): Map<string, TAvailabilityAlert[]> {
  const changeByKey = new Map(changes.map((c) => [keyOf(c.mediaType, c.tmdbId), c]));
  const alerts = new Map<string, TAvailabilityAlert[]>();

  for (const watcher of watchers) {
    const change = changeByKey.get(keyOf(watcher.mediaType, watcher.tmdbId));
    const providerId = change?.newProviderIds.find((id) => watcher.providerIds.includes(id));
    if (providerId === undefined) continue;
    const list = alerts.get(watcher.userId) ?? [];
    list.push({
      mediaType: watcher.mediaType,
      tmdbId: watcher.tmdbId,
      title: watcher.title,
      providerName: providerNames.get(providerId) ?? "une de vos plateformes",
    });
    alerts.set(watcher.userId, list);
  }
  return alerts;
}
