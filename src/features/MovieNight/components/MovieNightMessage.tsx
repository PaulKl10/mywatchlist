"use client";

import Link from "next/link";
import { MovieNightApiError } from "../services/movie-night.service";

interface MovieNightMessageProps {
  error: MovieNightApiError;
  onRetry: () => void;
  isRetrying?: boolean;
}

function unavailableText(error: MovieNightApiError): string | null {
  if (error.status === 404) return "Cette session n'existe plus.";
  if (error.status === 403) return "Vous ne faites plus partie de cette session.";
  return null;
}

export function MovieNightMessage({ error, onRetry, isRetrying = false }: MovieNightMessageProps) {
  const text = unavailableText(error);

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-base text-zinc-900 dark:text-zinc-100">
        {text ?? "Impossible de charger la session. Vérifiez votre connexion et réessayez."}
      </p>
      {text ? (
        <Link
          href="/ce-soir"
          className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
        >
          Retour à Ce soir ?
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
