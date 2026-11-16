import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { TMDB_TV_GENRES } from "@/features/DiscoverMovies/constants/tv-genres";

const GENRE_NAMES = new Map<number, string>(
  [...TMDB_TV_GENRES, ...TMDB_MOVIE_GENRES].map((g) => [g.id, g.name])
);

/**
 * Genres les plus présents parmi les titres notés : barres horizontales d'une seule couleur,
 * valeur écrite à côté (la couleur ne porte aucune information à elle seule).
 */
export function GenreBars({ genres }: { genres: { id: number; count: number }[] }) {
  const max = Math.max(...genres.map((g) => g.count), 1);

  return (
    <ul className="flex flex-col gap-3">
      {genres.map(({ id, count }) => {
        const name = GENRE_NAMES.get(id) ?? "Autre";
        const label = `${count} titre${count > 1 ? "s" : ""}`;
        return (
          <li key={id} className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
            <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">{name}</span>
            <div className="flex items-center gap-2" title={`${name} : ${label}`}>
              <div
                className="h-4 rounded-r bg-amber-500 dark:bg-amber-400"
                style={{ width: `${(count / max) * 100}%`, minWidth: "4px" }}
              />
              <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {count}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
