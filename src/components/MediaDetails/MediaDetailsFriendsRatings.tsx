"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";
import { User, UsersRound } from "lucide-react";
import { useFriendsTitleRatingsQuery } from "@/hooks/useFriendsTitleRatingsQuery";
import { averageRating, formatRating } from "@/lib/ratings/format";
import type { TMediaType } from "@/types/movie.type";

interface MediaDetailsFriendsRatingsProps {
  mediaId: number;
  mediaType: TMediaType;
  isAuthenticated: boolean;
}

/** « Vu par vos amis » : les amis qui ont noté le titre, avec leur note. Absente sinon. */
export function MediaDetailsFriendsRatings({
  mediaId,
  mediaType,
  isAuthenticated,
}: MediaDetailsFriendsRatingsProps) {
  const titleId = useId();
  const { data: ratings } = useFriendsTitleRatingsQuery(mediaId, mediaType, isAuthenticated);

  if (!ratings || ratings.length === 0) return null;

  const average = ratings.length > 1 ? averageRating(ratings.map((r) => r.rating)) : null;

  return (
    <section className="my-6" aria-labelledby={titleId}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id={titleId}
          className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <UsersRound className="h-5 w-5" aria-hidden="true" />
          Vu par vos amis
        </h2>
        {average !== null && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Moyenne{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-500">
              <span aria-hidden="true">★ </span>
              {formatRating(average)}
              <span className="sr-only"> sur 10</span>
            </span>
          </p>
        )}
      </div>
      <ul className="flex flex-wrap gap-2">
        {ratings.map(({ user, rating }) => (
          <li key={user.tmdbId}>
            <Link
              href={`/profile/${user.tmdbId}`}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm transition-colors hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500"
            >
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" fill sizes="28px" className="object-cover" />
                ) : (
                  <User className="m-1.5 h-4 w-4 text-zinc-500" aria-hidden="true" />
                )}
              </span>
              <span className="max-w-40 truncate font-medium text-zinc-900 dark:text-zinc-100">
                {user.name}
              </span>
              <span className="whitespace-nowrap font-semibold text-amber-600 dark:text-amber-500">
                <span aria-hidden="true">★ </span>
                {formatRating(rating)}
                <span className="sr-only"> sur 10</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
