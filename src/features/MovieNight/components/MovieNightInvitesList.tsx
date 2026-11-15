"use client";

import { useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useMovieNightInvitesQuery } from "../hooks/useMovieNightInvitesQuery";
import { useRespondToInviteMutation } from "../hooks/useMovieNightMutations";

interface MovieNightInvitesListProps {
  /** Lit les invitations : compte connecté (sur le profil, seulement s'il y en a en attente). */
  enabled: boolean;
  /** Contenu du titre de la section (texte, icône). */
  title: ReactNode;
  className?: string;
  titleClassName: string;
}

/**
 * Section des invitations « Ce soir ? » reçues (page /ce-soir et profil). Affichée s'il y a
 * des invitations en attente, ou si la dernière réponse a échoué : la liste est alors relue
 * (invitation caduque), et le message reste visible même si elle revient vide.
 */
export function MovieNightInvitesList({
  enabled,
  title,
  className,
  titleClassName,
}: MovieNightInvitesListProps) {
  const router = useRouter();
  const titleId = useId();
  const invitesQuery = useMovieNightInvitesQuery(enabled);
  const respond = useRespondToInviteMutation();
  const invites = enabled ? (invitesQuery.data ?? []) : [];

  if (invites.length === 0 && !respond.error) return null;

  const handleRespond = (id: string, accept: boolean) => {
    respond.mutate(
      { id, accept },
      { onSuccess: (data) => accept && router.push(`/ce-soir/${data.id}`) },
    );
  };

  return (
    <section className={className} aria-labelledby={titleId}>
      <h2 id={titleId} className={titleClassName}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {invites.length > 0 && (
          <ul className="flex flex-col gap-3">
            {invites.map((invite) => (
              <li key={invite.movieNightId} className="flex items-center gap-3">
                {invite.hostAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invite.hostAvatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <User className="h-5 w-5 text-zinc-500" />
                  </span>
                )}
                {/* Texte entier, boutons repliés en dessous quand la ligne est trop étroite. */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <p className="min-w-0 text-sm text-zinc-900 wrap-anywhere dark:text-zinc-100">
                    <span className="font-medium">{invite.hostName}</span> vous invite
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={respond.isPending}
                      onClick={() => handleRespond(invite.movieNightId, true)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                    >
                      Rejoindre
                    </button>
                    <button
                      type="button"
                      disabled={respond.isPending}
                      onClick={() => handleRespond(invite.movieNightId, false)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {respond.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {respond.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
