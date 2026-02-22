"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, ExternalLink } from "lucide-react";

const TMDB_SIGNUP_URL = "https://www.themoviedb.org/signup";

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/request-token", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur");
      }

      window.location.href = data.auth_url;
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Film className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          My Watchlist
        </h1>
        <p className="mb-8 text-center text-zinc-600 dark:text-zinc-400">
          Connectez-vous avec votre compte TMDB pour sauvegarder vos listes
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleConnect}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Redirection...
              </>
            ) : (
              "Se connecter avec TMDB"
            )}
          </button>

          <Link
            href={TMDB_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ExternalLink className="h-4 w-4" />
            S&apos;inscrire sur TMDB
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Vous n&apos;avez pas de compte ? Créez-en un gratuitement sur le site
          TMDB.
        </p>
      </div>
    </div>
  );
}
