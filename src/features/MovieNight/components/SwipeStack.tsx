"use client";

import { Heart, X } from "lucide-react";
import type { TDeckMovie } from "@/lib/movie-night/types";
import type { useSwipeGesture } from "../hooks/useSwipeGesture";
import { SwipeCard } from "./SwipeCard";

interface SwipeStackProps {
  deck: TDeckMovie[];
  /** Carte courante (doit exister dans `deck`). */
  index: number;
  gesture: ReturnType<typeof useSwipeGesture>;
}

/**
 * Pile de cartes (courante, suivante visible dessous, la suivante pour précharger l'affiche),
 * annonce pour les lecteurs d'écran et boutons « Non » / « Oui ». Solo comme à plusieurs.
 */
export function SwipeStack({ deck, index, gesture }: SwipeStackProps) {
  const { offsetX, isDragging, bind, fling } = gesture;
  const current = deck[index];
  const stack = deck.slice(index, index + 3);

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-x-0 bottom-3 top-0">
          {stack.map((movie, i) =>
            i === 0 ? (
              <SwipeCard
                key={movie.id}
                movie={movie}
                depth={0}
                offsetX={offsetX}
                isDragging={isDragging}
                bind={bind}
              />
            ) : (
              <SwipeCard key={movie.id} movie={movie} depth={i === 1 ? 1 : 2} />
            ),
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {`${current.title}, film ${index + 1} sur ${deck.length}`}
      </p>
      <div className="flex items-center justify-center gap-8">
        <button
          type="button"
          aria-label="Non"
          onClick={() => fling("left")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-500 shadow-sm transition-colors hover:border-zinc-400 hover:text-zinc-700 active:scale-95 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        >
          <X className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Oui"
          onClick={() => fling("right")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-zinc-950 shadow-sm transition-colors hover:bg-amber-400 active:scale-95"
        >
          <Heart className="h-7 w-7" fill="currentColor" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
