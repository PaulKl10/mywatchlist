import { NextResponse } from "next/server";

type TCdnCachePolicy = {
  /** Durée (s) pendant laquelle le CDN sert la réponse sans appeler la fonction. */
  sMaxAge: number;
  /** Durée (s) supplémentaire où une réponse périmée est servie pendant son rafraîchissement. */
  staleWhileRevalidate: number;
};

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Durées de cache CDN des données TMDB publiques. */
export const CDN_CACHE = {
  /** Listes qui évoluent dans la journée (découverte, recherche). */
  lists: { sMaxAge: HOUR, staleWhileRevalidate: DAY },
  /** Fiches : film, série, personne, casting, plateformes. */
  details: { sMaxAge: DAY, staleWhileRevalidate: 7 * DAY },
} as const satisfies Record<string, TCdnCachePolicy>;

/**
 * Réponse JSON mise en cache par le CDN (Vercel) : les requêtes suivantes sur la
 * même URL (query string comprise) ne déclenchent ni la fonction ni l'appel TMDB.
 *
 * À réserver aux réponses identiques pour tous les visiteurs : la route ne doit
 * lire ni cookie ni session, car le cache les ignore.
 */
export function publicCachedJson(
  data: unknown,
  { sMaxAge, staleWhileRevalidate }: TCdnCachePolicy
): NextResponse {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    },
  });
}
