"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Film, MonitorPlay, Tv } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { PageFilter } from "@/components/PageFilter";
import { WatchlistTvCard } from "@/features/Watchlist/components/WatchlistTvCard";
import { AvailableWatchlistGrid } from "@/features/Watchlist/components/AvailableWatchlistGrid";
import { MyProvidersPanel } from "@/features/Watchlist/components/MyProvidersPanel";
import {
  useAvailableWatchlistQuery,
  useGetWatchlistMoviesQuery,
  useGetWatchlistTvQuery,
} from "@/features/Watchlist/hooks/useGetWatchlistQuery";
import {
  useMyStreamingProviderIdsQuery,
  useStreamingProvidersQuery,
} from "@/features/MovieNight/hooks/useStreamingProvidersQuery";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

type MediaFilter = "movie" | "tv";

const GRID_CLASSES =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32";

/** Logos de plateformes affichés au plus dans le résumé du filtre. */
const SUMMARY_LOGO_COUNT = 6;

function plural(count: number, mediaFilter: MediaFilter): string {
  const noun = mediaFilter === "movie" ? "film" : "série";
  return `${count} ${noun}${count > 1 ? "s" : ""}`;
}

export function WatchlistView() {
  const [page, setPage] = useState(1);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("movie");

  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isEditingProviders, setIsEditingProviders] = useState(false);

  const moviesQuery = useGetWatchlistMoviesQuery(page);
  const tvQuery = useGetWatchlistTvQuery(page);
  const myProvidersQuery = useMyStreamingProviderIdsQuery(onlyAvailable);
  const providersQuery = useStreamingProvidersQuery(onlyAvailable);
  const myProviderIds = myProvidersQuery.data ?? [];
  const hasProviders = myProviderIds.length > 0;
  const showProvidersPanel =
    onlyAvailable && myProvidersQuery.isSuccess && (!hasProviders || isEditingProviders);
  const availableQuery = useAvailableWatchlistQuery(mediaFilter, onlyAvailable && hasProviders);
  const myProviders = (providersQuery.data ?? []).filter((p) => myProviderIds.includes(p.id));

  const moviesData = moviesQuery.data;
  const tvData = tvQuery.data;
  const { data, isLoading, isError, error } =
    mediaFilter === "movie" ? moviesQuery : tvQuery;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (filter: MediaFilter) => {
    setMediaFilter(filter);
    setPage(1);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          {error instanceof Error
            ? error.message
            : "Impossible de charger la watchlist"}
        </p>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        >
          Retour
        </Link>
      </div>
    );
  }

  const emptyMessage =
    mediaFilter === "movie"
      ? "Votre watchlist films est vide. Ajoutez des films depuis la page de détails !"
      : "Votre watchlist séries est vide. Ajoutez des séries depuis la page de détails !";

  const emptyCta =
    mediaFilter === "movie" ? "Découvrir des films" : "Découvrir des séries";

  const countLabel = onlyAvailable
    ? availableQuery.data
      ? `${plural(availableQuery.data.items.length, mediaFilter)} dispo`
      : null
    : data
      ? plural(data.total_results, mediaFilter)
      : null;

  const renderAvailableResults = () => {
    if (showProvidersPanel) {
      return (
        <div className="px-4 md:px-32">
          <MyProvidersPanel
            initialIds={myProviderIds}
            canCancel={hasProviders}
            onDone={() => setIsEditingProviders(false)}
          />
        </div>
      );
    }
    if (myProvidersQuery.isError) {
      return (
        <p role="alert" className="px-4 py-12 text-center text-zinc-600 dark:text-zinc-400 md:px-32">
          Impossible de charger tes plateformes.{" "}
          <button type="button" onClick={() => myProvidersQuery.refetch()} className="underline">
            Réessayer
          </button>
        </p>
      );
    }
    if (myProvidersQuery.isPending || availableQuery.isPending) {
      return (
        <div className="flex flex-col gap-3">
          <p className="px-4 text-sm text-zinc-500 dark:text-zinc-400 md:px-32">
            Vérification de tes plateformes…
          </p>
          <div className={GRID_CLASSES} aria-busy="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      );
    }
    if (availableQuery.isError || !availableQuery.data) {
      return (
        <p role="alert" className="px-4 py-12 text-center text-zinc-600 dark:text-zinc-400 md:px-32">
          Impossible de vérifier tes plateformes.{" "}
          <button type="button" onClick={() => availableQuery.refetch()} className="underline">
            Réessayer
          </button>
        </p>
      );
    }
    const { items, truncated } = availableQuery.data;
    return (
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-zinc-600 dark:text-zinc-400 md:px-32">
            {mediaFilter === "movie"
              ? "Aucun film de ta watchlist n'est dispo sur tes plateformes pour l'instant."
              : "Aucune série de ta watchlist n'est dispo sur tes plateformes pour l'instant."}
          </p>
        ) : (
          <AvailableWatchlistGrid items={items} className={GRID_CLASSES} />
        )}
        {truncated && (
          <p className="px-4 text-sm text-zinc-500 dark:text-zinc-400 md:px-32">
            Seuls les 250 derniers ajouts ont été vérifiés.
          </p>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className={GRID_CLASSES} aria-busy="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      );
    }

    if (!data) return null;

    if (data.results.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            {emptyCta}
          </Link>
        </div>
      );
    }

    if (mediaFilter === "movie" && moviesData) {
      return (
        <div className={GRID_CLASSES}>
          {moviesData.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      );
    }

    if (tvData) {
      return (
        <div className={GRID_CLASSES}>
          {tvData.results.map((tv) => (
            <WatchlistTvCard key={tv.id} tv={tv} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 flex flex-col gap-4 bg-zinc-50 pt-5 pb-3 dark:bg-zinc-950 px-4 md:px-32">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            Ma watchlist{" "}
            {countLabel ? (
              `(${countLabel})`
            ) : (
              <span
                aria-hidden
                className="inline-block h-4 w-20 animate-pulse rounded bg-zinc-200 align-middle dark:bg-zinc-800"
              />
            )}
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => handleFilterChange("movie")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mediaFilter === "movie"
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Film className="h-4 w-4" />
                Films
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("tv")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mediaFilter === "tv"
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Tv className="h-4 w-4" />
                Séries
              </button>
            </div>
            {!onlyAvailable && (
              <div className="flex justify-end">
                <PageFilter
                  currentPage={data?.page ?? page}
                  totalPages={data?.total_pages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={onlyAvailable}
            onClick={() => {
              setOnlyAvailable((value) => !value);
              setIsEditingProviders(false);
            }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              onlyAvailable
                ? "border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <MonitorPlay className="h-4 w-4" aria-hidden="true" />
            Dispo sur mes plateformes
          </button>
          {onlyAvailable && hasProviders && !isEditingProviders && (
            <div className="flex items-center gap-2">
              <ul className="flex items-center gap-1" aria-label="Mes plateformes">
                {myProviders.slice(0, SUMMARY_LOGO_COUNT).map((provider) => (
                  <li key={provider.id}>
                    {provider.logoPath ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w92${provider.logoPath}`}
                        alt={provider.name}
                        title={provider.name}
                        width={24}
                        height={24}
                        sizes="24px"
                        className="h-6 w-6 rounded"
                      />
                    ) : (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{provider.name}</span>
                    )}
                  </li>
                ))}
                {myProviders.length > SUMMARY_LOGO_COUNT && (
                  <li className="text-xs text-zinc-500">+{myProviders.length - SUMMARY_LOGO_COUNT}</li>
                )}
              </ul>
              <button
                type="button"
                onClick={() => setIsEditingProviders(true)}
                className="text-sm font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      </div>
      {onlyAvailable ? renderAvailableResults() : renderResults()}
    </div>
  );
}
