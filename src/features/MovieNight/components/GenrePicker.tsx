"use client";

import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";

interface GenrePickerProps {
  selected: number[];
  onChange: (ids: number[]) => void;
}

export function GenrePicker({ selected, onChange }: GenrePickerProps) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TMDB_MOVIE_GENRES.map((genre) => {
          const active = selected.includes(genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(genre.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-amber-500 bg-amber-500 font-medium text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Aucun genre coché = tous les genres
      </p>
    </div>
  );
}
