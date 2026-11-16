"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { RatedTitleCard } from "@/components/RatedTitleCard";
import { useFriendRatingsQuery } from "../hooks/useFriendRatingsQuery";

const PREVIEW_COUNT = 12;

/** Notes d'un ami sur son profil. Rien n'est affiché si elles ne sont pas visibles (pas ami). */
export function FriendRatingsSection({ tmdbId }: { tmdbId: number }) {
  const { data: ratings, isPending, isError } = useFriendRatingsQuery(tmdbId);
  const [showAll, setShowAll] = useState(false);

  if (isPending || isError || ratings === null || ratings === undefined) return null;

  const visible = showAll ? ratings : ratings.slice(0, PREVIEW_COUNT);
  const hidden = ratings.length - PREVIEW_COUNT;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        <Star className="h-5 w-5" aria-hidden="true" />
        Ses notes
      </h2>
      {ratings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune note pour l&apos;instant
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {visible.map((item) => (
              <RatedTitleCard key={`${item.mediaType}-${item.id}`} {...item} />
            ))}
          </div>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {showAll ? "Voir moins" : `Voir plus (${hidden} note${hidden > 1 ? "s" : ""})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
