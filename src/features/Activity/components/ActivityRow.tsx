import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import { formatRating } from "@/lib/ratings/format";
import type { TActivityItem } from "@/types/activity.type";
import { formatRelativeTime } from "../utils/relativeTime";

/** « Léa a noté Dune ★ 9 », « Tom a ajouté Oppenheimer à sa watchlist ». */
export function ActivityRow({ item, now }: { item: TActivityItem; now: Date }) {
  const mediaHref = item.mediaType === "tv" ? `/tv/${item.tmdbId}` : `/movies/${item.tmdbId}`;
  const profileHref = `/profile/${item.user.tmdbId}`;
  const titleLink = (
    <Link href={mediaHref} className="font-semibold text-zinc-900 hover:text-amber-600 dark:text-zinc-100">
      {item.title}
    </Link>
  );

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Link
        href={profileHref}
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        aria-label={`Profil de ${item.user.name}`}
      >
        {item.user.avatarUrl ? (
          <Image src={item.user.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <User className="m-2.5 h-5 w-5 text-zinc-400" aria-hidden="true" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <Link href={profileHref} className="font-medium hover:text-amber-600">
            {item.user.name}
          </Link>{" "}
          {item.type === "RATED" ? (
            <>
              a noté {titleLink}
              {item.rating !== null && (
                <span className="ml-1.5 whitespace-nowrap font-semibold text-amber-600 dark:text-amber-500">
                  ★ {formatRating(item.rating)}
                </span>
              )}
            </>
          ) : (
            <>a ajouté {titleLink} à sa watchlist</>
          )}
        </p>
        <time
          dateTime={item.createdAt}
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {formatRelativeTime(new Date(item.createdAt), now)}
        </time>
      </div>

      <Link
        href={mediaHref}
        className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.posterPath && (
          <Image src={`${TMDB_IMAGE_BASE}/w92${item.posterPath}`} alt="" fill sizes="44px" className="object-cover" />
        )}
      </Link>
    </li>
  );
}
