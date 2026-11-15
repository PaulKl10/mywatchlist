"use client";

import { Clock } from "lucide-react";
import {
  useWatchTimeQuery,
  useWatchTimeByUserQuery,
} from "@/features/WatchTime/hooks/useWatchTimeQuery";

interface WatchTimeStatsProps {
  /** Si fourni, affiche le temps de visionnage de cet utilisateur (profil ami) */
  tmdbId?: number;
}

function formatWatchTime(totalMinutes: number): {
  days: number;
  hours: number;
  minutes: number;
} {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return { days, hours: remainingHours, minutes };
}

/** Ex. « 3 films et 2 séries notés », « 1 série notée ». */
function formatRatedCount(movieCount: number, tvCount: number): string {
  const parts: string[] = [];
  if (movieCount > 0) parts.push(`${movieCount} film${movieCount > 1 ? "s" : ""}`);
  if (tvCount > 0) parts.push(`${tvCount} série${tvCount > 1 ? "s" : ""}`);

  const total = movieCount + tvCount;
  const feminine = movieCount === 0;
  return `${parts.join(" et ")} noté${feminine ? "e" : ""}${total > 1 ? "s" : ""}`;
}

export function WatchTimeStats({ tmdbId }: WatchTimeStatsProps = {}) {
  const ownQuery = useWatchTimeQuery();
  const userQuery = useWatchTimeByUserQuery(tmdbId ?? 0);

  const { data, isLoading, isError } = tmdbId != null ? userQuery : ownQuery;

  if (isLoading) {
    return (
      <div
        aria-hidden
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {/* L'en-tête passe sur 2 lignes en mobile (libellé + décompte) */}
        <div className="h-10 w-56 max-w-full animate-pulse rounded bg-zinc-200 sm:h-5 dark:bg-zinc-800" />
        <div className="h-16 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  if (data.totalMinutes === 0) {
    return null;
  }

  const { days, hours, minutes } = formatWatchTime(data.totalMinutes);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Décompte toujours sur sa propre ligne en mobile : hauteur fixe, quel que soit le texte */}
      <div className="flex flex-wrap items-center gap-x-2">
        <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Temps de visionnage
        </span>
        <span className="w-full pl-7 text-sm font-medium text-zinc-500 sm:w-auto sm:pl-0 dark:text-zinc-400">
          ({formatRatedCount(data.movieCount, data.tvCount)})
        </span>
      </div>
      <div className="flex items-baseline gap-2 h-16">
        {days > 0 && (
          <div className="flex items-center justify-center flex-1 h-full border border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {days} J{days > 1 ? "s" : ""}
            </span>
          </div>
        )}
        {hours > 0 && (
          <div className="flex items-center justify-center border flex-1 h-full border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {hours} H
            </span>
          </div>
        )}
        {minutes > 0 && (
          <div className="flex items-center justify-center border flex-1 h-full border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {minutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
