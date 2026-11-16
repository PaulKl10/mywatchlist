"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Clapperboard, Sparkles, Star } from "lucide-react";
import { RatedTitleCard } from "@/components/RatedTitleCard";
import { FIRST_YEARLY_BILAN } from "@/lib/bilan/compute";
import { useAuth } from "@/providers/AuthProvider";
import { GenreBars } from "../components/GenreBars";
import { StatTile } from "../components/StatTile";
import { useBilanQuery } from "../hooks/useBilanQuery";
import { formatDecade, formatWatchTime } from "../utils/format";

const numberFormat = new Intl.NumberFormat("fr-FR");
const ratingFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const messageClass =
  "rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400";
const sectionTitleClass =
  "mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200";

export function BilanView() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [year, setYear] = useState<number | null>(null);
  const { data, isPending, isError, refetch } = useBilanQuery(year, !!user);
  const availableYears = data?.availableYears ?? [];

  const periodTab = (value: number | null, label: string) => (
    <button
      key={label}
      type="button"
      aria-pressed={year === value}
      onClick={() => setYear(value)}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        year === value
          ? "bg-amber-500 text-white dark:bg-amber-600"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (isAuthLoading || (user && isPending)) {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[84px] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      );
    }
    if (!user) {
      return (
        <div className={messageClass}>
          <p>Connecte-toi pour voir ton bilan.</p>
          <Link href="/login" className="mt-3 inline-block font-medium text-amber-600 hover:text-amber-500">
            Connexion
          </Link>
        </div>
      );
    }
    if (isError || !data) {
      return (
        <p role="alert" className={messageClass}>
          Impossible de calculer ton bilan.{" "}
          <button type="button" onClick={() => refetch()} className="underline">
            Réessayer
          </button>
        </p>
      );
    }

    const { stats } = data;
    if (stats.ratedMovies + stats.ratedTv === 0) {
      return (
        <p className={messageClass}>
          {year === null
            ? "Pas encore de notes. Si tu viens d'arriver, l'import de tes notes TMDB peut prendre une minute."
            : `Aucune note en ${year} pour l'instant.`}
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Films notés" value={numberFormat.format(stats.ratedMovies)} />
          <StatTile label="Séries notées" value={numberFormat.format(stats.ratedTv)} />
          <StatTile label="Devant l'écran" value={formatWatchTime(stats.totalMinutes)} />
          <StatTile
            label="Note moyenne"
            value={stats.averageRating === null ? "—" : `${ratingFormat.format(stats.averageRating)}/10`}
          />
        </div>

        {stats.topGenres.length > 0 && (
          <section>
            <h2 className={sectionTitleClass}>
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Tes genres préférés
            </h2>
            <GenreBars genres={stats.topGenres} />
          </section>
        )}

        <section>
          <h2 className={sectionTitleClass}>
            <Star className="h-5 w-5" aria-hidden="true" />
            Tes meilleures notes
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {stats.topRated.map((title) => (
              <RatedTitleCard
                key={`${title.mediaType}-${title.tmdbId}`}
                id={title.tmdbId}
                mediaType={title.mediaType}
                title={title.title}
                posterPath={title.posterPath}
                rating={title.rating}
              />
            ))}
          </div>
        </section>

        {stats.favoriteDecade && (
          <section>
            <h2 className={sectionTitleClass}>
              <Clapperboard className="h-5 w-5" aria-hidden="true" />
              Ta décennie préférée
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDecade(stats.favoriteDecade.decade)}
              </span>{" "}
              · {stats.favoriteDecade.count} titre{stats.favoriteDecade.count > 1 ? "s" : ""} noté
              {stats.favoriteDecade.count > 1 ? "s" : ""}
            </p>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mon bilan</h1>
        {availableYears.length > 0 && (
          <div
            className="flex flex-wrap rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="Période"
          >
            {periodTab(null, "Depuis toujours")}
            {availableYears.map((y) => periodTab(y, String(y)))}
          </div>
        )}
      </div>
      {user && availableYears.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          Le bilan par année arrive en {FIRST_YEARLY_BILAN} : TMDB ne date pas les notes, l&apos;app
          les date depuis novembre 2026.
        </p>
      )}
      {renderContent()}
    </div>
  );
}
