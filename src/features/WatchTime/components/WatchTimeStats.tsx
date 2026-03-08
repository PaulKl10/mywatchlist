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

export function WatchTimeStats({ tmdbId }: WatchTimeStatsProps = {}) {
  const ownQuery = useWatchTimeQuery();
  const userQuery = useWatchTimeByUserQuery(tmdbId ?? 0);

  const { data, isLoading, isError } = tmdbId != null ? userQuery : ownQuery;

  if (isLoading) {
    return (
      <div className="h-20 w-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
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
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Temps de visionnage
        </span>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          ({data.movieCount} film{data.movieCount > 1 ? "s" : ""} noté
          {data.movieCount > 1 ? "s" : ""})
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {days > 0 && (
          <div className="flex items-center justify-center px-3 py-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {days} J{days > 1 ? "s" : ""}
            </span>
          </div>
        )}
        {hours > 0 && (
          <div className="flex items-center justify-center px-3 py-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {hours} H
            </span>
          </div>
        )}
        {minutes > 0 && (
          <div className="flex items-center justify-center px-3 py-6 border border-zinc-200 dark:border-zinc-700 rounded-md">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {minutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
