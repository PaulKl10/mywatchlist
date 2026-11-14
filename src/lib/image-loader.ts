"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Loader `next/image` sans optimisation Vercel : les images sont servies
 * directement par leurs CDN, à la taille demandée par le `srcset`.
 *
 * Les largeurs du `srcset` (`imageSizes` + `deviceSizes` dans next.config.ts)
 * correspondent aux tailles proposées par TMDB.
 */

/** Tailles TMDB utilisées. `original` (jusqu'à 4K) n'est jamais servi. */
const TMDB_SIZES = [92, 154, 185, 342, 500, 780, 1280] as const;
const TMDB_MAX_SIZE = TMDB_SIZES[TMDB_SIZES.length - 1];
const TMDB_URL = /^https:\/\/image\.tmdb\.org\/t\/p\/(w(\d+)|original)(\/.+)$/;

/**
 * La taille présente dans `src` sert de plafond : un composant qui demande
 * `/w500/` n'obtiendra jamais plus de w500, même sur un écran haute densité.
 */
function tmdbLoader(width: number, match: RegExpExecArray): string {
  const [, , requestedSize, path] = match;
  const cap = requestedSize ? Number(requestedSize) : TMDB_MAX_SIZE;
  const target = Math.min(width, cap);
  const size = TMDB_SIZES.find((s) => s >= target) ?? TMDB_MAX_SIZE;
  return `https://image.tmdb.org/t/p/w${size}${path}`;
}

/** placehold.co : les dimensions sont dans le chemin (`/500x750/...`). */
function placeholderLoader(width: number, url: URL): string {
  url.pathname = url.pathname.replace(
    /^\/(\d+)x(\d+)/,
    (_, w: string, h: string) =>
      `/${width}x${Math.round((width * Number(h)) / Number(w))}`
  );
  return url.toString();
}

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const tmdbMatch = TMDB_URL.exec(src);
  if (tmdbMatch) return tmdbLoader(width, tmdbMatch);

  if (!URL.canParse(src)) return src;
  const url = new URL(src);

  if (url.hostname === "secure.gravatar.com") {
    url.searchParams.set("s", String(Math.min(width, 2048)));
    return url.toString();
  }
  if (url.hostname === "placehold.co") return placeholderLoader(width, url);

  return src;
}
