"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { TDeckMovie, TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { MovieNightApiError } from "../services/movie-night.service";
import { activeHostName, joinNames, waitingNames } from "../utils/participants";
import { MoviePoster } from "./MoviePoster";

interface ResultRowProps {
  movie: TDeckMovie;
  note?: string;
  onWatch?: () => void;
  disabled: boolean;
}

function ResultRow({ movie, note, onWatch, disabled }: ResultRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <MoviePoster title={movie.title} posterPath={movie.posterPath} className="w-14" />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{movie.title}</p>
        {note && (
          <p className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            <span className="sr-only">Oui : </span>
            {note}
          </p>
        )}
      </div>
      {onWatch && (
        <button
          type="button"
          disabled={disabled}
          onClick={onWatch}
          className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          On regarde ça
        </button>
      )}
    </li>
  );
}

export function RoundResults({ state }: { state: TMovieNightState }) {
  const queryClient = useQueryClient();
  const { decide, newRound } = useMovieNightMutations(state.id);
  const busy = decide.isPending || newRound.isPending;

  if (!state.everyoneFinished) {
    const names = joinNames(waitingNames(state));
    return (
      <p
        role="status"
        className="flex flex-1 items-center justify-center text-center text-zinc-600 dark:text-zinc-400"
      >
        {names ? `En attente de ${names}…` : "En attente des autres…"}
      </p>
    );
  }

  const watch = (movie: TDeckMovie) => {
    decide.mutate(
      { action: "watch", movieId: movie.id },
      {
        onError: (error) => {
          if (error instanceof MovieNightApiError && error.code === "wrong_status") {
            void queryClient.invalidateQueries({ queryKey: ["movie-night", state.id] });
          }
        },
      },
    );
  };
  const onWatch = (movie: TDeckMovie) => (state.canDecide ? () => watch(movie) : undefined);

  const hasMatches = state.matches.length > 0;
  const podium = state.podium ?? [];
  const hostName = activeHostName(state);
  const error = decide.error?.message ?? newRound.error?.message;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <h2 className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {hasMatches ? "Vos matchs" : "Le podium"}
      </h2>
      {hasMatches ? (
        <ul className="flex flex-col gap-2">
          {state.matches.map((movie) => (
            <ResultRow key={movie.id} movie={movie} onWatch={onWatch(movie)} disabled={busy} />
          ))}
        </ul>
      ) : podium.length === 0 ? (
        <p className="py-6 text-center text-zinc-600 dark:text-zinc-400">Aucun film n&apos;a plu</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {podium.map((entry) => (
            <ResultRow
              key={entry.movie.id}
              movie={entry.movie}
              note={`${entry.yesCount} / ${entry.voterCount}`}
              onWatch={onWatch(entry.movie)}
              disabled={busy}
            />
          ))}
        </ol>
      )}
      {state.canDecide ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => newRound.mutate()}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Nouvelle pile
        </button>
      ) : (
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          {hostName ? `En attente de ${hostName}` : "En attente d'une décision…"}
        </p>
      )}
      <p role="alert" className="min-h-4 text-center text-xs text-red-600 dark:text-red-400">
        {error ?? ""}
      </p>
    </div>
  );
}
