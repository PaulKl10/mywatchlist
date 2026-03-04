"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { User, X, UserPlus, Loader2 } from "lucide-react";
import { useSearchUsersQuery } from "@/features/Profile/hooks/useSearchUsersQuery";
import { useAddFriendMutation } from "@/features/Profile/hooks/useAddFriendMutation";
import { formatUserId } from "@/features/Profile/utils/formatUserId";

type AddFriendModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: users, isLoading } = useSearchUsersQuery(debouncedQuery, isOpen);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);
  const addMutation = useAddFriendMutation();

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const handleAdd = (tmdbId: number) => {
    addMutation.mutate(tmdbId, {
      onSuccess: () => handleClose(),
      onError: (err) => {
        console.error(err);
      },
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        aria-hidden
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Ajouter un ami
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom..."
          className="mb-4 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
          autoFocus
        />

        <div className="max-h-64 overflow-y-auto">
          {debouncedQuery.trim().length < 2 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Tapez au moins 2 caractères pour rechercher
            </p>
          ) : isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : !users || users.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Aucun utilisateur trouvé
            </p>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => {
                const gravatarUrl = u.gravatar_hash
                  ? `https://secure.gravatar.com/avatar/${u.gravatar_hash}?s=64&d=identicon`
                  : null;
                const tmdbUrl = u.tmdb_avatar_path
                  ? `https://image.tmdb.org/t/p/w185${u.tmdb_avatar_path}`
                  : null;
                const avatarUrl = gravatarUrl || tmdbUrl;
                const safeAvatar =
                  avatarUrl &&
                  avatarUrl.startsWith("https://") &&
                  avatarUrl.length > 20
                    ? avatarUrl
                    : null;
                const isAdding =
                  addMutation.isPending &&
                  addMutation.variables === u.tmdb_id;

                return (
                  <li
                    key={u.tmdb_id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        {safeAvatar ? (
                          <Image
                            src={safeAvatar}
                            alt={u.username || "Avatar"}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-zinc-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {u.username || `Utilisateur ${u.tmdb_id}`}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {formatUserId(u.tmdb_id)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(u.tmdb_id)}
                      disabled={addMutation.isPending}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Ajouter
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {addMutation.isError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {addMutation.error instanceof Error
              ? addMutation.error.message
              : "Erreur lors de l'ajout"}
          </p>
        )}
      </div>
    </>
  );
}
