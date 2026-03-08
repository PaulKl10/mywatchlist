"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { SearchMoviesView } from "@/features/SearchMovies/View/SearchMoviesView";
import { MenuBurger } from "@/components/MenuBurger";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useNotificationCountsQuery } from "@/features/Notifications/hooks/useNotificationCountsQuery";
import { useAppBadge } from "@/features/Notifications/hooks/useAppBadge";

const PATH_TITLES: Record<string, string> = {
  "/": "My Watchlist",
  "/discover": "Explorer",
  "/watchlist": "Ma watchlist",
  "/rated-movies": "Mes films notés",
  "/profile": "Mon profil",
  "/login": "Connexion",
  "/login/callback": "Connexion",
};

function getTitleFromPathname(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  if (pathname.startsWith("/movies/")) return "Film";
  if (pathname.startsWith("/profile/")) return "Profil";
  if (pathname.startsWith("/person/")) return "Filmographie";
  return "My Watchlist";
}

interface HeaderProps {
  showSearch?: boolean;
}

export function Header({ showSearch = true }: HeaderProps) {
  const pathname = usePathname();
  const title = useMemo(() => getTitleFromPathname(pathname ?? "/"), [pathname]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();

  const gravatarHash = user?.avatar?.gravatar?.hash?.trim() || null;
  const gravatarUrl = gravatarHash
    ? `https://secure.gravatar.com/avatar/${gravatarHash}?s=64&d=identicon`
    : null;

  const tmdbAvatarPath = user?.avatar?.tmdb?.avatar_path?.trim() || null;
  const tmdbAvatarUrl = tmdbAvatarPath
    ? tmdbAvatarPath.startsWith("http")
      ? tmdbAvatarPath
      : `https://image.tmdb.org/t/p/w185${tmdbAvatarPath}`
    : null;

  const avatarUrl = gravatarUrl || tmdbAvatarUrl || null;
  const safeAvatarUrl =
    typeof avatarUrl === "string" &&
    avatarUrl.startsWith("https://") &&
    avatarUrl.length > 20
      ? avatarUrl
      : null;

  const { data: notificationCounts } = useNotificationCountsQuery(!!user);
  const totalNotifications = notificationCounts?.total ?? 0;

  useAppBadge(totalNotifications);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-32">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBurgerOpen(true)}
            className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={
              totalNotifications > 0
                ? `Ouvrir le menu (${totalNotifications} notification${totalNotifications > 1 ? "s" : ""})`
                : "Ouvrir le menu"
            }
          >
            <Menu className="h-6 w-6" />
            {totalNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5">
                <NotificationBadge count={totalNotifications} />
              </span>
            )}
          </button>
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && !user && (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Connexion
            </Link>
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

      <MenuBurger
        isOpen={isBurgerOpen}
        onClose={() => setIsBurgerOpen(false)}
        user={user}
        onLogout={logout}
        avatarUrl={safeAvatarUrl}
        notificationCounts={notificationCounts}
      />

      {isSearchOpen && (
        <SearchMoviesView onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
}
