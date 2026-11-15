"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clapperboard, KeyRound, type LucideIcon } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { JoinMovieNightForm } from "../components/JoinMovieNightForm";
import { MovieNightConfigForm } from "../components/MovieNightConfigForm";
import { MovieNightInvitesList } from "../components/MovieNightInvitesList";

type TPanel = "host" | "join";

const sectionClass =
  "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
const titleClass = "mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100";

interface ChoiceButtonProps {
  icon: LucideIcon;
  title: string;
  hint: string;
  onClick: () => void;
  buttonRef: React.Ref<HTMLButtonElement>;
}

function ChoiceButton({ icon: Icon, title, hint, onClick, buttonRef }: ChoiceButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-amber-500 focus-visible:border-amber-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{hint}</span>
      </span>
    </button>
  );
}

interface PanelProps {
  title: string;
  onBack: () => void;
  headingRef: React.Ref<HTMLHeadingElement>;
  children: ReactNode;
}

function Panel({ title, onBack, headingRef, children }: PanelProps) {
  return (
    <section className={sectionClass} aria-labelledby="movie-night-panel-title">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour
      </button>
      <h2 id="movie-night-panel-title" ref={headingRef} tabIndex={-1} className={`${titleClass} focus:outline-none`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Entrée de « Ce soir ? » : on choisit d'abord « Héberger » ou « Rejoindre avec un code ».
 * Un lien partagé (`?code=…`) ouvre directement « Rejoindre », code pré-rempli.
 */
export function MovieNightHomeView() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get("code") ?? "").toUpperCase();
  const isLoggedIn = !!user;
  const [panel, setPanel] = useState<TPanel | null>(initialCode ? "join" : null);

  // Focus après un changement d'écran : titre du panneau ouvert, ou bouton du choix quitté.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hostButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);
  const focusTarget = useRef<"heading" | TPanel | null>(null);

  useEffect(() => {
    const target = focusTarget.current;
    focusTarget.current = null;
    if (target === "heading") headingRef.current?.focus();
    else if (target === "host") hostButtonRef.current?.focus();
    else if (target === "join") joinButtonRef.current?.focus();
  }, [panel]);

  const open = (next: TPanel) => {
    focusTarget.current = "heading";
    setPanel(next);
  };
  const back = () => {
    focusTarget.current = panel;
    setPanel(null);
  };

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chargement…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MovieNightInvitesList
        enabled={isLoggedIn}
        title="Invitations reçues"
        className={sectionClass}
        titleClassName={titleClass}
      />

      {panel === null && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            icon={Clapperboard}
            title="Héberger"
            hint="Choisissez les plateformes, puis jouez seul ou à plusieurs."
            onClick={() => open("host")}
            buttonRef={hostButtonRef}
          />
          <ChoiceButton
            icon={KeyRound}
            title="Rejoindre avec un code"
            hint="Entrez le code reçu d'un ami."
            onClick={() => open("join")}
            buttonRef={joinButtonRef}
          />
        </div>
      )}

      {panel === "host" && (
        <Panel title="Héberger" onBack={back} headingRef={headingRef}>
          {isLoggedIn ? (
            <MovieNightConfigForm />
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/login"
                className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
              >
                Connectez-vous pour héberger
              </Link>
            </p>
          )}
        </Panel>
      )}

      {panel === "join" && (
        <Panel title="Rejoindre avec un code" onBack={back} headingRef={headingRef}>
          <JoinMovieNightForm initialCode={initialCode} askName={!isLoggedIn} />
        </Panel>
      )}
    </div>
  );
}
