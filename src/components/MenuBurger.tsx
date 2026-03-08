"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Compass, Home, LogOut, Star, User, X } from "lucide-react";
import { NotificationBadge } from "@/components/NotificationBadge";
import type { TNotificationCount } from "@/app/api/notifications/count/route";

type AuthUser = {
  username: string;
};

interface MenuBurgerProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onLogout: () => void;
  avatarUrl: string | null;
  notificationCounts?: TNotificationCount | null;
}

const navLinkClass =
  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700";

export function MenuBurger({
  isOpen,
  onClose,
  user,
  onLogout,
  avatarUrl,
  notificationCounts,
}: MenuBurgerProps) {
  useLayoutEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-9998 bg-zinc-900/50 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 top-0 right-10 z-9999 flex flex-col border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 flex-1"
        role="dialog"
        aria-label="Menu de navigation"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto p-3">
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                className="mb-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="relative shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <User className="h-5 w-5 text-zinc-500" />
                    </div>
                  )}
                  {(notificationCounts?.total ?? 0) > 0 && (
                    <span className="absolute -right-1 -top-1">
                      <NotificationBadge count={notificationCounts!.total} />
                    </span>
                  )}
                </span>
                <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {user.username}
                </span>
              </Link>
              <Link href="/" onClick={onClose} className={navLinkClass}>
                <Home className="h-5 w-5 shrink-0" />
                Accueil
              </Link>
              <Link
                href="/watchlist"
                onClick={onClose}
                className={navLinkClass}
              >
                <Bookmark className="h-5 w-5 shrink-0" />
                Ma watchlist
              </Link>
              <Link
                href="/rated-movies"
                onClick={onClose}
                className={navLinkClass}
              >
                <Star className="h-5 w-5 shrink-0" />
                Mes films notés
              </Link>
              <Link href="/discover" onClick={onClose} className={navLinkClass}>
                <Compass className="h-5 w-5 shrink-0" />
                Explorer
              </Link>
              <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className={`${navLinkClass} w-full text-left`}
              >
                <LogOut className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 dark:hover:bg-zinc-700 dark:hover:text-red-300" />
                <span className="text-red-600 dark:text-red-400 dark:hover:bg-zinc-700 dark:hover:text-red-300">
                  Déconnexion
                </span>
              </button>
            </>
          ) : (
            <Link href="/login" onClick={onClose} className={navLinkClass}>
              <User className="h-5 w-5 shrink-0" />
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
