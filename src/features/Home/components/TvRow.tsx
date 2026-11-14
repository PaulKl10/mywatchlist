"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import {
  RowScrollButtons,
  type TScrollDirection,
} from "@/features/Home/components/RowScrollButtons";
import { TvCard } from "@/components/TvCard";
import type { TDiscoverTv } from "@/types/movie.type";

type TvRowProps = {
  title: string;
  tvShows: TDiscoverTv[];
  isLoading?: boolean;
  exploreHref?: string;
};

const CARD_WIDTH = 160;
const GAP = 12;

export function TvRow({
  title,
  tvShows,
  isLoading,
  exploreHref,
}: TvRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: TScrollDirection) => {
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
            className="flex items-center gap-1.5 text-lg font-semibold text-zinc-900 transition-colors hover:text-primary dark:text-zinc-100 dark:hover:text-primary"
          >
            {title} <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
        )}
        <RowScrollButtons onScroll={scroll} />
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_: unknown, i: number) => (
            <div
              key={i}
              className="h-[240px] w-[160px] shrink-0 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))
        ) : (
          tvShows.map((tv) => (
            <div key={tv.id} className="w-[160px] shrink-0">
              <TvCard tv={tv} sizes={`${CARD_WIDTH}px`} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
