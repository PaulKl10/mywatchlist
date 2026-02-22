"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, LogOut, Search, User } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-32">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </Link>
          {user && (
            <Link
              href="/watchlist"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Bookmark className="h-4 w-4" />
              Watchlist
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <User className="h-4 w-4" />
                    {user.username}
                  </button>
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-9998"
                        aria-hidden
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                        <Link
                          href="/watchlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        >
                          <Bookmark className="h-4 w-4" />
                          Ma watchlist
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Connexion
                </Link>
              )}
            </>
          )}
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
        </div>
      </header>

      {isSearchOpen && (
        <SearchMoviesView onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
}
