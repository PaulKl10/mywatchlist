"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift, Check, X } from "lucide-react";
import { useSuggestionsQuery } from "@/features/Suggestions/hooks/useSuggestionsQuery";
import { useAcceptSuggestionMutation } from "@/features/Suggestions/hooks/useAcceptSuggestionMutation";
import { useDeclineSuggestionMutation } from "@/features/Suggestions/hooks/useDeclineSuggestionMutation";
import { useAuth } from "@/providers/AuthProvider";
import { formatUserId } from "@/features/Profile/utils/formatUserId";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

export function SuggestionsList() {
  const { user } = useAuth();
  const { data: suggestions, isLoading } = useSuggestionsQuery(!!user);
  const acceptMutation = useAcceptSuggestionMutation();
  const declineMutation = useDeclineSuggestionMutation();

  if (!user) return null;

  if (isLoading) {
    return (
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        <Gift className="h-5 w-5" />
        Suggestions reçues
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Link
              href={
                suggestion.media_type === "tv"
                  ? `/tv/${suggestion.tmdb_movie_id}`
                  : `/movies/${suggestion.tmdb_movie_id}`
              }
              className="relative aspect-2/3 block bg-zinc-200 dark:bg-zinc-800"
            >
              <Image
                src={
                  suggestion.poster_path
                    ? `${TMDB_IMAGE_BASE}/w500${suggestion.poster_path}`
                    : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
                }
                alt={suggestion.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </Link>
            <div className="flex flex-1 flex-col p-3">
              <Link
                href={
                  suggestion.media_type === "tv"
                    ? `/tv/${suggestion.tmdb_movie_id}`
                    : `/movies/${suggestion.tmdb_movie_id}`
                }
                className="line-clamp-2 font-medium text-zinc-900 hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-500"
              >
                {suggestion.title}
              </Link>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Par {suggestion.sender.username || formatUserId(suggestion.sender.tmdb_id)}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => acceptMutation.mutate(suggestion.id)}
                  disabled={
                    (acceptMutation.isPending &&
                      acceptMutation.variables === suggestion.id) ||
                    (declineMutation.isPending &&
                      declineMutation.variables === suggestion.id)
                  }
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {acceptMutation.isPending &&
                  acceptMutation.variables === suggestion.id
                    ? "…"
                    : <span className="hidden md:inline">Accepter</span>}
                </button>
                <button
                  type="button"
                  onClick={() => declineMutation.mutate(suggestion.id)}
                  disabled={
                    (acceptMutation.isPending &&
                      acceptMutation.variables === suggestion.id) ||
                    (declineMutation.isPending &&
                      declineMutation.variables === suggestion.id)
                  }
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Refuser</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
