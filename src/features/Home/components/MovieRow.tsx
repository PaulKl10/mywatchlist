"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import type { TMovie } from "@/types/movie.type";

type MovieRowProps = {
  title: string;
  movies: TMovie[];
  isLoading?: boolean;
  exploreHref?: string;
};

const CARD_WIDTH = 160;
const GAP = 12;

export function MovieRow({ title, movies, isLoading, exploreHref }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = (CARD_WIDTH + GAP) * 4;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        {exploreHref ? (
          <Link
            href={exploreHref}
            className="flex items-center gap-1.5 text-lg font-semibold text-zinc-900 transition-colors hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-500"
          >
            {title} <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
        )}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="rounded-full bg-zinc-200/80 p-2 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            aria-label="Défiler à gauche"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="rounded-full bg-zinc-200/80 p-2 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            aria-label="Défiler à droite"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[240px] w-[160px] shrink-0 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))
        ) : (
          movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[160px] shrink-0"
            >
              <MovieCard movie={movie} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
