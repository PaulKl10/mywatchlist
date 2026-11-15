"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useMovieNightInvitesQuery } from "../hooks/useMovieNightInvitesQuery";
import { JoinMovieNightForm } from "../components/JoinMovieNightForm";
import { MovieNightConfigForm } from "../components/MovieNightConfigForm";
import { MovieNightInvitesList } from "../components/MovieNightInvitesList";

const sectionClass =
  "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
const titleClass = "mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100";

export function MovieNightHomeView() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get("code") ?? "").toUpperCase();
  const isLoggedIn = !!user;
  const invitesQuery = useMovieNightInvitesQuery(isLoggedIn);
  const hasInvites = (invitesQuery.data?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chargement…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoggedIn && hasInvites && (
        <section className={sectionClass} aria-labelledby="invites-title">
          <h2 id="invites-title" className={titleClass}>
            Invitations reçues
          </h2>
          <MovieNightInvitesList invites={invitesQuery.data ?? []} />
        </section>
      )}

      {isLoggedIn ? (
        <section className={sectionClass} aria-labelledby="create-title">
          <h2 id="create-title" className={titleClass}>
            Créer une session
          </h2>
          <MovieNightConfigForm />
        </section>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
          >
            Connectez-vous pour créer une session
          </Link>
        </p>
      )}

      <section className={sectionClass} aria-labelledby="join-title">
        <h2 id="join-title" className={titleClass}>
          Rejoindre avec un code
        </h2>
        <JoinMovieNightForm initialCode={initialCode} askName={!isLoggedIn} />
      </section>
    </div>
  );
}
