"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Heart, X } from "lucide-react";
import type { TDeckMovie, TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { useSwipeGesture, type TSwipeDirection } from "../hooks/useSwipeGesture";
import { MovieNightApiError } from "../services/movie-night.service";
import { firstUnvotedIndex } from "../utils/swipe";
import { ParticipantAvatars } from "./ParticipantAvatars";
import { RoundResults } from "./RoundResults";
import { SwipeCard } from "./SwipeCard";

interface SwipeDeckProps {
  state: TMovieNightState;
  /** Appelé une fois le départ confirmé (navigation vers /ce-soir). */
  onLeft: () => void;
  /** Pile en pause (écran « Match ! ») : les touches fléchées ne votent plus, le geste en cours est annulé. */
  paused?: boolean;
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
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

  const { offsetX, isDragging, bind, fling, reset } = useSwipeGesture((direction) => {
    if (current) castVote(current, direction);
  });

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

  const hasCard = current !== undefined && !paused;
  useEffect(() => {
    if (!hasCard) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditable(event.target) || isEditable(document.activeElement)) return;
      event.preventDefault();
      fling(event.key === "ArrowRight" ? "right" : "left");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasCard, fling]);

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
  // Carte courante, carte suivante (visible dessous) et la suivante (affiche préchargée).
  const stack = deck.slice(index, index + 3);

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
        <>
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-x-0 bottom-3 top-0">
              {stack.map((movie, i) => {
                const depth = i === 0 ? 0 : i === 1 ? 1 : 2;
                return depth === 0 ? (
                  <SwipeCard
                    key={movie.id}
                    movie={movie}
                    depth={0}
                    offsetX={offsetX}
                    isDragging={isDragging}
                    bind={bind}
                  />
                ) : (
                  <SwipeCard key={movie.id} movie={movie} depth={depth} />
                );
              })}
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {`${current.title}, film ${position} sur ${total}`}
          </p>
          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              aria-label="Non"
              onClick={() => fling("left")}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-500 shadow-sm transition-colors hover:border-zinc-400 hover:text-zinc-700 active:scale-95 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            >
              <X className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Oui"
              onClick={() => fling("right")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-zinc-950 shadow-sm transition-colors hover:bg-amber-400 active:scale-95"
            >
              <Heart className="h-7 w-7" fill="currentColor" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <RoundResults state={state} />
      )}

      <p role="alert" className="min-h-4 text-center text-xs text-red-600 dark:text-red-400">
        {message ?? ""}
      </p>
    </div>
  );
}
