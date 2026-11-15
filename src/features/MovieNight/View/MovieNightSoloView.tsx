"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useSoloDeckMutation } from "../hooks/useMovieNightMutations";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { useSwipeKeys } from "../hooks/useSwipeKeys";
import { MovieNightEnded } from "../components/MovieNightEnded";
import { SwipeStack } from "../components/SwipeStack";
import {
  loadSoloGame,
  nextSoloDeck,
  resumeSolo,
  saveSoloGame,
  soloExcludedIds,
  soloStatus,
  swipeSolo,
  type TSoloGame,
  type TSoloStatus,
} from "../utils/soloGame";

const linkClass =
  "font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500";

const noopSubscribe = () => () => {};

/** false au rendu serveur et à l'hydratation, true ensuite : le stockage n'est lu qu'au client. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Partie solo, jouée dans le navigateur : aucune requête pendant les swipes. Relue depuis
 * l'onglet au montage (un rechargement reprend la pile) ; sans partie, retour à /ce-soir.
 */
export function MovieNightSoloView() {
  const router = useRouter();
  const isClient = useIsClient();
  const stored = useMemo(() => (isClient ? loadSoloGame() : null), [isClient]);
  const [played, setPlayed] = useState<TSoloGame | null>(null);
  const game = played ?? stored;
  const missing = isClient && game === null;

  useEffect(() => {
    if (missing) router.replace("/ce-soir");
  }, [missing, router]);

  // Changement d'écran pendant la partie (pas au chargement) : le focus va à l'élément
  // `data-screen-focus` du nouvel écran, annoncé par les lecteurs d'écran.
  const status = game ? soloStatus(game) : null;
  const screenRef = useRef<HTMLDivElement>(null);
  const previousStatus = useRef<TSoloStatus | null>(null);
  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;
    if (previous !== null && status !== null && previous !== status) {
      screenRef.current?.querySelector<HTMLElement>("[data-screen-focus]")?.focus();
    }
  }, [status]);

  const update = (next: TSoloGame) => {
    setPlayed(next);
    saveSoloGame(next);
  };

  if (!game) {
    return <p className="py-16 text-center text-zinc-600 dark:text-zinc-400">Chargement…</p>;
  }

  return (
    <div ref={screenRef}>
      <SoloScreen game={game} onChange={update} onQuit={() => router.push("/ce-soir")} />
    </div>
  );
}

interface SoloScreenProps {
  game: TSoloGame;
  onChange: (game: TSoloGame) => void;
  onQuit: () => void;
}

function SoloScreen({ game, onChange, onQuit }: SoloScreenProps) {
  switch (soloStatus(game)) {
    case "swiping":
      return <SoloSwipe game={game} onSwipe={(liked) => onChange(swipeSolo(game, liked))} onQuit={onQuit} />;
    case "chosen":
      return (
        <MovieNightEnded movie={game.deck.find((m) => m.id === game.chosenMovieId) ?? null}>
          {game.index < game.deck.length && (
            <button type="button" onClick={() => onChange(resumeSolo(game))} className={linkClass}>
              Reprendre la pile
            </button>
          )}
        </MovieNightEnded>
      );
    case "exhausted":
      return <SoloExhausted game={game} onNextDeck={onChange} />;
  }
}

interface SoloSwipeProps {
  game: TSoloGame;
  onSwipe: (liked: boolean) => void;
  onQuit: () => void;
}

function SoloSwipe({ game, onSwipe, onQuit }: SoloSwipeProps) {
  // Callback figé au lancement de la carte : il vise la partie de ce rendu, et le verrou du
  // geste empêche un second lancement avant que la carte suivante soit en place.
  const gesture = useSwipeGesture((direction) => onSwipe(direction === "right"));
  useSwipeKeys(true, gesture.fling);

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.75rem)] min-h-[30rem] w-full max-w-sm flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={onQuit}
          className="-ml-2 flex items-center gap-1 justify-self-start rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Quitter
        </button>
        <p
          data-screen-focus
          tabIndex={-1}
          className="text-sm font-medium tabular-nums text-zinc-700 focus:outline-none dark:text-zinc-300"
        >
          <span className="sr-only">Film </span>
          {game.index + 1} / {game.deck.length}
        </p>
      </div>
      <SwipeStack deck={game.deck} index={game.index} gesture={gesture} />
      {/* Même hauteur que la ligne de message de la pile à plusieurs. */}
      <div className="min-h-4" aria-hidden="true" />
    </div>
  );
}

interface SoloExhaustedProps {
  game: TSoloGame;
  onNextDeck: (game: TSoloGame) => void;
}

function SoloExhausted({ game, onNextDeck }: SoloExhaustedProps) {
  const soloDeck = useSoloDeckMutation();

  const handleNextDeck = () => {
    soloDeck.mutate(
      { ...game.settings, excludedMovieIds: soloExcludedIds(game) },
      { onSuccess: ({ deck }) => onNextDeck(nextSoloDeck(game, deck)) },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 py-16 text-center">
      <h2 data-screen-focus tabIndex={-1} className="text-xl font-bold text-zinc-900 focus:outline-none dark:text-zinc-100">
        Aucun film retenu
      </h2>
      <button
        type="button"
        disabled={soloDeck.isPending}
        onClick={handleNextDeck}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {soloDeck.isPending ? "Préparation…" : "Nouvelle pile"}
      </button>
      {soloDeck.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {soloDeck.error.message}
        </p>
      )}
      <Link href="/ce-soir" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
        Retour à Ce soir ?
      </Link>
    </div>
  );
}
