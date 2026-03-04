"use client";

import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import { useFriendsQuery } from "@/features/Profile/hooks/useFriendsQuery";
import { useSuggestMovieMutation } from "@/features/Suggestions/hooks/useSuggestMovieMutation";
import { useAuth } from "@/providers/AuthProvider";

type FormValues = {
  receiverId: string;
};

type SuggestToFriendFormProps = {
  movieId: number;
  movieTitle: string;
  posterPath?: string | null;
};

export function SuggestToFriendForm({
  movieId,
  movieTitle,
  posterPath,
}: SuggestToFriendFormProps) {
  const { user } = useAuth();
  const { data: friends, isLoading } = useFriendsQuery(!!user);
  const mutation = useSuggestMovieMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { receiverId: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (!values.receiverId) return;
    mutation.mutate(
      {
        receiverId: values.receiverId,
        tmdbMovieId: movieId,
        title: movieTitle,
        poster_path: posterPath ?? null,
      },
      {
        onSuccess: () => reset(),
      }
    );
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-3 h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (!friends || friends.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        Suggérer à un ami
      </h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex-1">
          <label htmlFor="receiverId" className="sr-only">
            Choisir un ami
          </label>
          <select
            id="receiverId"
            {...register("receiverId", {
              required: "Choisissez un ami",
            })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">— Choisir un ami —</option>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.username || `Utilisateur ${friend.tmdb_id}`}
              </option>
            ))}
          </select>
          {errors.receiverId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.receiverId.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {mutation.isPending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Erreur lors de l'envoi"}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Suggestion envoyée !
        </p>
      )}
    </form>
  );
}
