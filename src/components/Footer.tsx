import Image from "next/image";
import Link from "next/link";
import {
  ABOUT_ANCHORS,
  ABOUT_PATH,
  PUBLISHER,
  TMDB_NOTICE,
  TMDB_URL,
} from "@/lib/legal";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const LEGAL_LINKS = [
  { href: `${ABOUT_PATH}#${ABOUT_ANCHORS.credits}`, label: "À propos et crédits" },
  { href: `${ABOUT_PATH}#${ABOUT_ANCHORS.legalNotice}`, label: "Mentions légales" },
  { href: `${ABOUT_PATH}#${ABOUT_ANCHORS.privacy}`, label: "Confidentialité" },
] as const;

const linkClass =
  "text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-900 md:px-32">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            My Watchlist
          </span>
          <span className="hidden text-zinc-300 dark:text-zinc-600 sm:inline">
            •
          </span>
          <a
            href={PUBLISHER.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 text-sm ${linkClass}`}
          >
            <GithubIcon className="h-4 w-4" />
            {PUBLISHER.pseudonym}
          </a>
        </div>

        <nav aria-label="Informations légales">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-md flex-col items-center gap-2">
          <a
            href={TMDB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="The Movie Database (TMDB)"
          >
            <Image src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} unoptimized />
          </a>
          <p className="text-xs text-zinc-500">{TMDB_NOTICE}</p>
        </div>
      </div>
    </footer>
  );
}
