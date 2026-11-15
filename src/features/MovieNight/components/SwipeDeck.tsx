"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TDeckMovie, TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { useSwipeGesture, type TSwipeDirection } from "../hooks/useSwipeGesture";
import { useSwipeKeys } from "../hooks/useSwipeKeys";
import { MovieNightApiError } from "../services/movie-night.service";
import { firstUnvotedIndex } from "../utils/swipe";
import { ParticipantAvatars } from "./ParticipantAvatars";
import { RoundResults } from "./RoundResults";
import { SwipeStack } from "./SwipeStack";

interface SwipeDeckProps {
  state: TMovieNightState;
  /** Appelé une fois le départ confirmé (navigation vers /ce-soir). */
  onLeft: () => void;
  /** Pile en pause (écran « Match ! ») : les touches fléchées ne votent plus, le geste en cours est annulé. */
  paused?: boolean;
}

function withoutVote(votes: Record<number, boolean>, movieId: number): Record<number, boolean> {
  const next = { ...votes };
  delete next[movieId];
  return next;
}

export function SwipeDeck({ state, onLeft, paused = false }: SwipeDeckProps) {
  const { vote, leave } = useMovieNightMutations(state.id);
  // Votes envoyés depuis ce client (en cours ou acceptés). Ajoutés aux votes du serveur, ils
  // donnent la carte courante : un rafraîchissement du polling, même en retard sur un vote, ne
  // peut ni faire reculer ni sauter une carte. Retirés seulement si le vote est refusé.
  const [localVotes, setLocalVotes] = useState<Record<number, boolean>>({});
  const sentIds = useRef(new Set<number>());
  const [voteError, setVoteError] = useState<string | null>(null);

  const deck = state.round?.deck ?? [];
  const index = firstUnvotedIndex(deck, { ...state.myVotes, ...localVotes });
  const current: TDeckMovie | undefined = deck[index];
  const total = deck.length;
  const position = Math.min(index + 1, total);

  // reset() du geste, appelé quand un vote est refusé. Passe par une ref car castVote doit être
  // déclaré avant useSwipeGesture, qui le reçoit.
  const resetGesture = useRef<() => void>(() => {});

  function castVote(movie: TDeckMovie, direction: TSwipeDirection) {
    // Jamais deux votes pour le même film depuis ce client (Review Focus 3).
    if (sentIds.current.has(movie.id) || movie.id in state.myVotes) return;
    const liked = direction === "right";
    sentIds.current.add(movie.id);
    setVoteError(null);
    setLocalVotes((votes) => ({ ...votes, [movie.id]: liked }));
    vote.mutateAsync({ movieId: movie.id, liked }).catch((error: unknown) => {
      // Vote refusé : retour à l'index serveur, la carte revient (Review Focus 2 pour match_pending).
      sentIds.current.delete(movie.id);
      setLocalVotes((votes) => withoutVote(votes, movie.id));
      resetGesture.current();
      if (!(error instanceof MovieNightApiError && error.code === "match_pending")) {
        setVoteError(error instanceof Error ? error.message : "Vote non enregistré.");
      }
    });
  }

  const gesture = useSwipeGesture((direction) => {
    if (current) castVote(current, direction);
  });
  const { reset } = gesture;

  useLayoutEffect(() => {
    resetGesture.current = reset;
  }, [reset]);

  // Pause arrivée en plein glissement : la carte revient en place et le pointeur est oublié.
  // Sinon elle resterait décalée sous la pile inerte, qui ne reçoit plus le relâchement, et les
  // glissements suivants seraient ignorés. Une carte lancée pendant la pause revient aussi :
  // le serveur refuserait son vote (match_pending).
  useEffect(() => {
    if (paused) reset();
  }, [paused, reset]);

  useSwipeKeys(current !== undefined && !paused, gesture.fling);

  // Promesse plutôt qu'un callback de mutate : elle aboutit même si ce composant est démonté
  // entre-temps (ex. passage en MATCH), et onLeft vit dans la vue, toujours montée.
  const handleLeave = () => {
    leave
      .mutateAsync()
      .then(onLeft)
      .catch(() => {
        // Erreur affichée via leave.error.
      });
  };

  const message = leave.error?.message ?? voteError;

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.75rem)] min-h-[30rem] w-full max-w-sm flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={handleLeave}
          disabled={leave.isPending}
          className="-ml-2 flex items-center gap-1 justify-self-start rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Quitter
        </button>
        <p className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
          <span className="sr-only">Film </span>
          {position} / {total}
        </p>
        <div className="justify-self-end">
          <ParticipantAvatars
            participants={state.participants}
            meParticipantId={state.me.participantId}
          />
        </div>
      </div>

      {current ? (
        <SwipeStack deck={deck} index={index} gesture={gesture} />
      ) : (
        <RoundResults state={state} />
      )}

      <p role="alert" className="min-h-4 text-center text-xs text-red-600 dark:text-red-400">
        {message ?? ""}
      </p>
    </div>
  );
}
