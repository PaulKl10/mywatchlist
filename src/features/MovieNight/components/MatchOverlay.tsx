"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { decisionErrorMessage } from "../utils/errors";
import { activeHostName } from "../utils/participants";
import { MoviePoster } from "./MoviePoster";
import { ParticipantAvatars } from "./ParticipantAvatars";

interface MatchOverlayProps {
  state: TMovieNightState;
  /** Appelé une fois le départ confirmé (navigation vers /ce-soir). */
  onLeft: () => void;
}

export function MatchOverlay({ state, onLeft }: MatchOverlayProps) {
  const { decide, leave } = useMovieNightMutations(state.id);
  const movie = state.pendingMatch;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus dans la boîte de dialogue à l'ouverture (lecteurs d'écran, clavier).
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  if (!movie) return null;

  const hostName = activeHostName(state);
  // Décision périmée (un autre a tranché, l'hôte est revenu) : resynchronisée par la mutation,
  // sans message.
  const error = decisionErrorMessage(decide.error) ?? leave.error?.message;

  // Même départ que depuis la pile : la promesse aboutit même si l'écran est démonté entre-temps.
  // Seule issue pour qui ne décide pas, le header étant recouvert.
  const handleLeave = () => {
    leave
      .mutateAsync()
      .then(onLeft)
      .catch(() => {
        // Erreur affichée via leave.error.
      });
  };

  // Au-dessus du header (z-[9995]), comme les autres modales. Boîte centrée par my-auto : sur un
  // écran trop court, elle part du haut et défile au lieu d'être coupée.
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-zinc-950/90 p-4 outline-none backdrop-blur-sm"
    >
      <div className="my-auto flex w-full max-w-sm flex-col items-center gap-4 py-4 text-center">
        <h2 id="match-title" className="text-4xl font-extrabold tracking-tight text-amber-500">
          Match !
        </h2>
        <MoviePoster
          title={movie.title}
          posterPath={movie.posterPath}
          className="w-40 [@media(max-height:700px)]:w-28"
          priority
        />
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
              onClick={() => decide.mutate({ action: "watch", movieId: movie.id })}
              className="rounded-lg bg-amber-500 px-4 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              On regarde ça
            </button>
            <button
              type="button"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ action: "continue", movieId: movie.id })}
              className="rounded-lg border border-zinc-600 px-4 py-3 text-base font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-base text-zinc-300">
              {hostName ? `${hostName} décide…` : "En attente d'une décision…"}
            </p>
            <button
              type="button"
              onClick={handleLeave}
              disabled={leave.isPending}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Quitter
            </button>
          </>
        )}
        <p role="alert" className="min-h-4 text-xs text-red-400">
          {error ?? ""}
        </p>
      </div>
    </div>
  );
}
