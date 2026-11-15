"use client";

import { useRouter } from "next/navigation";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNight } from "../hooks/useMovieNight";
import { MovieNightLobby } from "../components/MovieNightLobby";
import { MovieNightMessage } from "../components/MovieNightMessage";

function Placeholder({ text }: { text: string }) {
  return <p className="py-16 text-center text-zinc-600 dark:text-zinc-400">{text}</p>;
}

// Slot rempli en tâche 10 (SWIPING et MATCH).
function MovieNightSwiping({ state }: { id: string; state: TMovieNightState }) {
  return <Placeholder text={state.status === "MATCH" ? "Match !" : "Swipe en cours…"} />;
}

// Slot rempli en tâche 11.
function MovieNightEnded({ state }: { id: string; state: TMovieNightState }) {
  return <Placeholder text={state.chosenMovie ? `Ce soir : ${state.chosenMovie.title}` : "Session terminée"} />;
}

export function MovieNightSessionView({ id }: { id: string }) {
  const router = useRouter();
  const query = useMovieNight(id);

  if (query.error) {
    return (
      <MovieNightMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const state = query.data;
  if (!state) return <Placeholder text="Chargement…" />;

  switch (state.status) {
    case "LOBBY":
      return <MovieNightLobby id={id} state={state} onLeft={() => router.push("/ce-soir")} />;
    case "SWIPING":
    case "MATCH":
      return <MovieNightSwiping id={id} state={state} />;
    case "ENDED":
      return <MovieNightEnded id={id} state={state} />;
  }
}
