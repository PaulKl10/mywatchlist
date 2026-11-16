import { JUSTWATCH_URL } from "@/lib/legal";

/** Crédit exigé par TMDB partout où sont affichées des plateformes de streaming. */
export function JustWatchAttribution({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-zinc-500 ${className}`}>
      Plateformes : données fournies par{" "}
      <a
        href={JUSTWATCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-400"
      >
        JustWatch
      </a>
    </p>
  );
}
