"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { isGone, useMovieNight } from "../hooks/useMovieNight";
import { MovieNightLobby } from "../components/MovieNightLobby";
import { MovieNightMessage } from "../components/MovieNightMessage";
import { MatchOverlay } from "../components/MatchOverlay";
import { MovieNightEnded } from "../components/MovieNightEnded";
import { SwipeDeck } from "../components/SwipeDeck";

function Placeholder({ text }: { text: string }) {
  return <p className="py-16 text-center text-zinc-600 dark:text-zinc-400">{text}</p>;
}

export function MovieNightSessionView({ id }: { id: string }) {
  const router = useRouter();
  const query = useMovieNight(id);
  // Départ confirmé : le 403 qui suit (invalidation, polling) ne doit pas afficher d'erreur.
  const [hasLeft, setHasLeft] = useState(false);

  const handleLeft = () => {
    setHasLeft(true);
    router.push("/ce-soir");
  };

  if (hasLeft) return <Placeholder text="Retour à Ce soir ?…" />;

  const state = query.data;
  const error = query.error;
  // Écran d'erreur seulement si la session est perdue (403/404) ou jamais chargée : une coupure
  // passagère pendant le polling laisse l'écran en place (la pile ne disparaît pas en plein swipe).
  if (error && (isGone(error) || !state)) {
    return (
      <MovieNightMessage
        error={error}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  if (!state) return <Placeholder text="Chargement…" />;

  return (
    <div className="relative">
      {error && (
        <p
          role="status"
          className="absolute inset-x-0 -top-5 text-center text-xs text-amber-600 dark:text-amber-500"
        >
          Connexion instable…
        </p>
      )}
      {renderStatus(id, state, handleLeft)}
    </div>
  );
}

function renderStatus(id: string, state: TMovieNightState, onLeft: () => void) {
  switch (state.status) {
    case "LOBBY":
      return <MovieNightLobby id={id} state={state} onLeft={onLeft} />;
    case "SWIPING":
    case "MATCH":
      // Même arbre pour les deux statuts : la pile reste montée (votes locaux, geste) sous l'écran
      // « Match ! ». Remontée seulement à chaque nouvelle pile (clé). Pendant MATCH, la pile est
      // inerte : ni clavier, ni pointeur, ni tabulation.
      return (
        <>
          <div inert={state.status === "MATCH"}>
            <SwipeDeck
              key={state.round?.index ?? 0}
              state={state}
              onLeft={onLeft}
              paused={state.status === "MATCH"}
            />
          </div>
          {state.status === "MATCH" && <MatchOverlay state={state} />}
        </>
      );
    case "ENDED":
      return <MovieNightEnded state={state} />;
  }
}
