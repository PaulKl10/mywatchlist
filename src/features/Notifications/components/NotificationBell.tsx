"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useMarkNotificationsReadMutation } from "../hooks/useMarkNotificationsReadMutation";
import { useNotificationsQuery } from "../hooks/useNotificationsQuery";
import { NotificationRow } from "./NotificationRow";

const messageClass = "px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400";

interface NotificationBellProps {
  /** Demandes en attente (badge), d'après `/api/notifications/count`. */
  count: number;
}

/**
 * Cloche de l'en-tête : ouvre la liste des demandes en attente (invitations « Ce soir ? »,
 * demandes d'ami, suggestions) et des réponses à mes suggestions, marquées lues à l'ouverture.
 * Un clic sur une ligne mène à la page où la traiter.
 * Le panneau se place contre l'en-tête (positionné), pas contre la cloche : il garde ainsi
 * les marges de la page, y compris sur mobile.
 */
export function NotificationBell({ count }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  const queryClient = useQueryClient();
  const { data: items, isPending, isError, refetch, dataUpdatedAt } = useNotificationsQuery(isOpen);
  const { mutate: markRead } = useMarkNotificationsReadMutation();

  // Réponses vues à l'ouverture : marquées lues une fois (liste triée, la 1re est la plus récente).
  const newestUnread = isOpen
    ? (items?.find((item) => item.type === "suggestion_answered" && item.unread)?.createdAt ?? null)
    : null;
  const markedUntilRef = useRef<string | null>(null);
  useEffect(() => {
    if (!newestUnread || markedUntilRef.current === newestUnread) return;
    markedUntilRef.current = newestUnread;
    markRead(newestUnread);
  }, [newestUnread, markRead]);

  // Changement de page (retour arrière, lien ailleurs) : on referme.
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const toggle = () => {
    // Le badge suit la liste relue à l'ouverture.
    if (!isOpen) void queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    setIsOpen((open) => !open);
  };

  const renderContent = () => {
    if (isPending) {
      return (
        <ul className="flex flex-col gap-1 p-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </ul>
      );
    }
    if (isError) {
      return (
        <p role="alert" className={messageClass}>
          Impossible de charger les notifications.{" "}
          <button type="button" onClick={() => refetch()} className="underline">
            Réessayer
          </button>
        </p>
      );
    }
    if (items.length === 0) {
      return (
        <div className={messageClass}>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Aucune notification</p>
          <p className="mt-1">
            Invitations « Ce soir ? », suggestions, demandes d&apos;ami et réponses à vos
            suggestions arriveront ici.
          </p>
        </div>
      );
    }
    const now = new Date(dataUpdatedAt);
    return (
      <>
        <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto overscroll-contain dark:divide-zinc-800">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} now={now} onNavigate={() => setIsOpen(false)} />
          ))}
        </ul>
        <p className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Les demandes disparaissent une fois traitées, les réponses au bout de 30 jours.
        </p>
      </>
    );
  };

  return (
    <div ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={count > 0 ? `Notifications (${count} en attente)` : "Notifications"}
        className={`relative rounded-lg p-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
          isOpen
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-primary"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5" aria-hidden="true">
            <NotificationBadge count={count} />
          </span>
        )}
      </button>
      {isOpen && (
        <section
          id={panelId}
          aria-labelledby={titleId}
          className="absolute inset-x-4 top-full z-10 mt-2 flex max-h-[min(32rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl sm:left-auto sm:w-96 md:right-32 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2
            id={titleId}
            className="border-b border-zinc-200 px-4 py-3 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
          >
            Notifications
          </h2>
          {renderContent()}
        </section>
      )}
    </div>
  );
}
