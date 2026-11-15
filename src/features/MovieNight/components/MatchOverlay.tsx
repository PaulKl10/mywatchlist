"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { MovieNightApiError } from "../services/movie-night.service";
import { activeHostName } from "../utils/participants";
import { MoviePoster } from "./MoviePoster";
import { ParticipantAvatars } from "./ParticipantAvatars";

export function MatchOverlay({ state }: { state: TMovieNightState }) {
  const queryClient = useQueryClient();
  const { decide } = useMovieNightMutations(state.id);
  const movie = state.pendingMatch;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus dans la boîte de dialogue à l'ouverture (lecteurs d'écran, clavier).
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  if (!movie) return null;

  const hostName = activeHostName(state);
  const send = (decision: Parameters<typeof decide.mutate>[0]) => {
    decide.mutate(decision, {
      onError: (error) => {
        // Décision périmée (un autre a déjà tranché) : on resynchronise, le prochain état fait foi.
        if (error instanceof MovieNightApiError && error.code === "wrong_status") {
          void queryClient.invalidateQueries({ queryKey: ["movie-night", state.id] });
        }
      },
    });
  };
  const error =
    decide.error instanceof MovieNightApiError && decide.error.code === "wrong_status"
      ? null
      : decide.error?.message;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/90 p-4 outline-none backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 py-4 text-center">
        <h2 id="match-title" className="text-4xl font-extrabold tracking-tight text-amber-500">
          Match !
        </h2>
        <MoviePoster title={movie.title} posterPath={movie.posterPath} className="w-40" priority />
        <p className="text-xl font-semibold text-zinc-50">{movie.title}</p>
        <ParticipantAvatars
          participants={state.participants}
          meParticipantId={state.me.participantId}
        />
        {state.canDecide ? (
          <div className="mt-2 flex w-full flex-col gap-2">
            <button
              type="button"
              disabled={decide.isPending}
              onClick={() => send({ action: "watch", movieId: movie.id })}
              className="rounded-lg bg-amber-500 px-4 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              On regarde ça
            </button>
            <button
              type="button"
              disabled={decide.isPending}
              onClick={() => send({ action: "continue", movieId: movie.id })}
              className="rounded-lg border border-zinc-600 px-4 py-3 text-base font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        ) : (
          <p className="mt-2 text-base text-zinc-300">
            {hostName ? `${hostName} décide…` : "En attente d'une décision…"}
          </p>
        )}
        <p role="alert" className="min-h-4 text-xs text-red-400">
          {error ?? ""}
        </p>
      </div>
    </div>
  );
}
