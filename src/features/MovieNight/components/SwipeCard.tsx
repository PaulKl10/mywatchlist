"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { Film } from "lucide-react";
import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import type { TDeckMovie } from "@/lib/movie-night/types";
import {
  SWIPE_EXIT_MS,
  SWIPE_EXIT_OFFSET,
  TAP_SLOP_PX,
  type TSwipeBind,
  type TSwipeDirection,
} from "../hooks/useSwipeGesture";
import { SWIPE_DISTANCE_THRESHOLD } from "../utils/swipe";

const GENRE_NAMES = new Map<number, string>(TMDB_MOVIE_GENRES.map((g) => [g.id, g.name]));
const MAX_GENRES = 3;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** 139 → « 2 h 19 », 120 → « 2 h », 45 → « 45 min ». */
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

function metaLine(movie: TDeckMovie): string {
  const parts: string[] = [];
  if (movie.releaseDate) parts.push(movie.releaseDate.slice(0, 4));
  if (movie.runtime) parts.push(formatRuntime(movie.runtime));
  if (movie.voteAverage > 0) parts.push(`★ ${movie.voteAverage.toFixed(1)}`);
  return parts.join(" · ");
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function cardStyle(
  depth: 0 | 1 | 2,
  offsetX: number,
  isDragging: boolean,
  reducedMotion: boolean,
): CSSProperties {
  const transition = isDragging
    ? "none"
    : `transform ${SWIPE_EXIT_MS}ms ease-out, opacity ${SWIPE_EXIT_MS}ms ease-out`;
  if (depth > 0) {
    // Carte suivante : légèrement réduite, son bord bas dépasse de 10 px sous la carte du dessus.
    return { transform: "translateY(calc(2.5% + 10px)) scale(0.95)", transition };
  }
  const isExiting = !isDragging && Math.abs(offsetX) >= SWIPE_EXIT_OFFSET;
  // Mouvement réduit : pas de rotation, déplacement borné, la sortie se fait en fondu.
  const transform = reducedMotion
    ? `translateX(${clamp(offsetX, -SWIPE_DISTANCE_THRESHOLD, SWIPE_DISTANCE_THRESHOLD)}px)`
    : `translateX(${offsetX}px) rotate(${offsetX / 20}deg)`;
  return { transform, opacity: isExiting ? 0 : 1, transition, willChange: "transform" };
}

function ProviderBadge({ provider }: { provider: NonNullable<TDeckMovie["provider"]> }) {
  if (provider.logoPath) {
    return (
      <Image
        src={`${TMDB_IMAGE_BASE}/w92${provider.logoPath}`}
        alt={provider.name}
        title={provider.name}
        width={40}
        height={40}
        sizes="40px"
        draggable={false}
        className="pointer-events-none absolute left-3 top-3 h-10 w-10 rounded-lg shadow-md"
      />
    );
  }
  return (
    <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-md bg-zinc-950/75 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
      {provider.name}
    </span>
  );
}

// Le tampon est placé du côté opposé au glissement : quand la carte part à droite, son bord
// droit sort de l'écran, « OUI » reste lisible à gauche (et inversement pour « NON »).
interface StampProps {
  label: string;
  opacity: number;
  /** Sens du glissement qui fait apparaître le tampon. */
  direction: TSwipeDirection;
}

function Stamp({ label, opacity, direction }: StampProps) {
  const position =
    direction === "right"
      ? "left-4 -rotate-[14deg] border-green-500 text-green-500"
      : "right-4 rotate-[14deg] border-zinc-200 text-zinc-200";
  return (
    <span
      aria-hidden="true"
      style={{ opacity }}
      className={`pointer-events-none absolute top-16 rounded-lg border-[3px] bg-zinc-950/35 px-2.5 py-0.5 text-2xl font-extrabold tracking-wider ${position}`}
    >
      {label}
    </span>
  );
}

interface SwipeCardProps {
  movie: TDeckMovie;
  /** 0 : carte du dessus ; 1 : carte suivante, visible en dessous ; 2 : affiche préchargée, masquée. */
  depth: 0 | 1 | 2;
  offsetX?: number;
  isDragging?: boolean;
  bind?: TSwipeBind;
}

export function SwipeCard({ movie, depth, offsetX = 0, isDragging = false, bind }: SwipeCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [showSynopsis, setShowSynopsis] = useState(false);
  const tap = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const isTop = depth === 0;
  const genres = movie.genreIds
    .map((id) => GENRE_NAMES.get(id))
    .filter((name): name is string => !!name)
    .slice(0, MAX_GENRES);
  const meta = metaLine(movie);
  const progress = Math.min(1, Math.abs(offsetX) / SWIPE_DISTANCE_THRESHOLD);

  // Un toucher sans glissement (< TAP_SLOP_PX) bascule le synopsis ; le reste va au geste de swipe.
  const handlers = bind && {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (!tap.current && (event.pointerType !== "mouse" || event.button === 0)) {
        tap.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      }
      bind.onPointerDown(event);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const t = tap.current;
      if (t && t.id === event.pointerId && !t.moved) {
        t.moved = Math.hypot(event.clientX - t.x, event.clientY - t.y) >= TAP_SLOP_PX;
      }
      bind.onPointerMove(event);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      const t = tap.current;
      if (t && t.id === event.pointerId) {
        tap.current = null;
        if (!t.moved) setShowSynopsis((value) => !value);
      }
      bind.onPointerUp(event);
    },
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
      if (tap.current?.id === event.pointerId) tap.current = null;
      bind.onPointerCancel(event);
    },
  };

  const layer = isTop
    ? "z-20 cursor-grab touch-none active:cursor-grabbing"
    : depth === 1
      ? "pointer-events-none z-10"
      : "pointer-events-none invisible z-0";

  return (
    <article
      inert={!isTop}
      style={cardStyle(depth, offsetX, isDragging, reducedMotion)}
      className={`absolute inset-0 select-none overflow-hidden rounded-2xl bg-zinc-800 shadow-xl ${layer}`}
      {...handlers}
    >
      {movie.posterPath ? (
        <Image
          src={`${TMDB_IMAGE_BASE}/w500${movie.posterPath}`}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 384px"
          loading="eager"
          fetchPriority={isTop ? "high" : "auto"}
          draggable={false}
          className="pointer-events-none object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-zinc-500">
          <Film className="h-16 w-16" aria-hidden="true" />
        </div>
      )}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          showSynopsis
            ? "bg-zinc-950/75"
            : "bg-gradient-to-t from-zinc-950 via-zinc-950/75 via-30% to-transparent to-60%"
        }`}
      />

      {movie.provider && <ProviderBadge provider={movie.provider} />}
      {isTop && <Stamp label="OUI" direction="right" opacity={offsetX > 0 ? progress : 0} />}
      {isTop && <Stamp label="NON" direction="left" opacity={offsetX < 0 ? progress : 0} />}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 text-white">
        <h2 className="line-clamp-2 text-2xl font-bold leading-tight">{movie.title}</h2>
        {meta && <p className="text-sm text-zinc-300">{meta}</p>}
        {genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
            {genres.map((name) => (
              <li
                key={name}
                className="rounded-full bg-zinc-700/85 px-2.5 py-0.5 text-xs text-zinc-100"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
        <p
          className={
            showSynopsis
              ? "mt-1 max-h-56 touch-pan-y overflow-y-auto text-sm leading-relaxed text-zinc-200"
              : "sr-only"
          }
        >
          {movie.overview || "Pas de synopsis disponible."}
        </p>
        <button
          type="button"
          aria-expanded={showSynopsis}
          // Au clavier seulement (detail === 0) : au toucher, la bascule passe par le geste de la carte.
          onClick={(event) => {
            if (event.detail === 0) setShowSynopsis((value) => !value);
          }}
          className="mt-1 self-center rounded text-xs text-zinc-400 focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          {showSynopsis
            ? "Touchez la carte pour masquer le synopsis"
            : "Touchez la carte pour le synopsis"}
        </button>
      </div>
    </article>
  );
}
