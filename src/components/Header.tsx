"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SearchMoviesView } from "@/features/SearchMovies/View/SearchMoviesView";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export function Header({
  title = "My Watchlist",
  showSearch = true,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-32">
        <Link
          href="/"
          className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </Link>
        {showSearch && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Rechercher un film"
          >
            <Search className="h-6 w-6" />
          </button>
        )}
      </header>

      {isSearchOpen && (
        <SearchMoviesView onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
}
