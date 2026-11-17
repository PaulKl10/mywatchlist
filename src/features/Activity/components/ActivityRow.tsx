"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Laugh, ThumbsDown, User, type LucideIcon } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import { formatRating } from "@/lib/ratings/format";
import type { TActivityItem } from "@/types/activity.type";
import type { TReaction } from "@/lib/activity/reactions";
import { useActivityReactionMutation } from "../hooks/useActivityReactionMutation";
import { formatRelativeTime } from "../utils/relativeTime";

const REACTION_BUTTONS: {
  reaction: TReaction;
  Icon: LucideIcon;
  /** Verbe de l'action, pour le nom accessible. */
  verb: string;
  activeClass: string;
}[] = [
  {
    reaction: "LIKE",
    Icon: Heart,
    verb: "Aimer",
    activeClass: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
  },
  {
    reaction: "LAUGH",
    Icon: Laugh,
    verb: "Rire de",
    activeClass: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
  },
  {
    reaction: "DISLIKE",
    Icon: ThumbsDown,
    verb: "Ne pas aimer",
    activeClass: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/10",
  },
];

/** Réactions à l'événement : une au plus par personne ; un 2e clic sur la même la retire. */
function ReactionBar({ item }: { item: TActivityItem }) {
  const react = useActivityReactionMutation();

  return (
    <div className="-my-1 flex items-center gap-0.5" role="group" aria-label="Réactions">
      {REACTION_BUTTONS.map(({ reaction, Icon, verb, activeClass }) => {
        const isMine = item.myReaction === reaction;
        const count = item.reactions[reaction];
        const label = `${verb} l'activité de ${item.user.name}`;
        return (
          <button
            key={reaction}
            type="button"
            onClick={() =>
              react.mutate({ activityId: item.id, reaction: isMine ? null : reaction })
            }
            disabled={react.isPending}
            aria-pressed={isMine}
            aria-label={count > 0 ? `${label} (${count})` : label}
            title={label}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
              isMine
                ? activeClass
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${isMine && reaction === "LIKE" ? "fill-current" : ""}`}
              aria-hidden="true"
            />
            {count > 0 && <span aria-hidden="true">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

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
        <div className="mt-0.5 flex items-center gap-2">
          <time
            dateTime={item.createdAt}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatRelativeTime(new Date(item.createdAt), now)}
          </time>
          <ReactionBar item={item} />
        </div>
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
