"use client";

import { Users } from "lucide-react";
import type { TCastMember } from "@/types/movie.type";
import { CastCard } from "@/features/MovieDetails/components/CastCard";

interface MediaDetailsCastProps {
  cast: TCastMember[];
  maxDisplay?: number;
}

export function MediaDetailsCast({
  cast,
  maxDisplay = 20,
}: MediaDetailsCastProps) {
  if (cast.length === 0) return null;

  const sortedCast = [...cast].sort((a, b) => a.order - b.order).slice(0, maxDisplay);

  return (
    <div className="my-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <Users className="h-5 w-5" />
        Distribution
      </h2>
      <div className="flex flex-wrap justify-center gap-4 pb-2 md:justify-start">
        {sortedCast.map((castMember) => (
          <CastCard key={castMember.id} castMember={castMember} />
        ))}
      </div>
    </div>
  );
}
