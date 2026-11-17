import Image from "next/image";
import Link from "next/link";
import { BookmarkCheck, Clapperboard, Gift, User, UserPlus, X } from "lucide-react";
import { formatRelativeTime } from "@/features/Activity/utils/relativeTime";
import { declineReasonLabel } from "@/lib/suggestions/declineReasons";
import type { TNotificationItem } from "@/types/notification.type";

/** « Titre », guillemets collés au titre par des espaces insécables. */
const quoted = (title: string) => `«\u00A0${title}\u00A0»`;

/** Pictogramme du type, posé sur l'avatar. */
function NotificationIcon({ item }: { item: TNotificationItem }) {
  const className = "h-3 w-3";
  switch (item.type) {
    case "movie_night_invite":
      return <Clapperboard className={className} aria-hidden="true" />;
    case "friend_request":
      return <UserPlus className={className} aria-hidden="true" />;
    case "suggestion":
      return <Gift className={className} aria-hidden="true" />;
    case "suggestion_answered":
      return item.accepted ? (
        <BookmarkCheck className={className} aria-hidden="true" />
      ) : (
        <X className={className} aria-hidden="true" />
      );
  }
}

function NotificationText({ item }: { item: TNotificationItem }) {
  const name = (
    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.actor.name}</span>
  );
  switch (item.type) {
    case "movie_night_invite":
      return <>{name} vous invite à {quoted("Ce soir\u00A0?")}</>;
    case "friend_request":
      return <>{name} vous a demandé en ami</>;
    case "suggestion":
      return (
        <>
          {name} vous propose {item.mediaType === "tv" ? "la série" : "le film"}{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{quoted(item.title)}</span>
        </>
      );
    case "suggestion_answered": {
      const title = (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{quoted(item.title)}</span>
      );
      return item.accepted ? (
        <>
          {name} a ajouté votre suggestion {title} à sa watchlist
        </>
      ) : (
        <>
          {name} a refusé votre suggestion {title}
        </>
      );
    }
  }
}

interface NotificationRowProps {
  item: TNotificationItem;
  now: Date;
  onNavigate: () => void;
}

/**
 * Ligne du panneau : avatar de l'ami, pictogramme du type, texte et date (et motif d'un refus) ;
 * mène à la page où traiter la demande, ou à la fiche du titre pour une réponse.
 */
export function NotificationRow({ item, now, onNavigate }: NotificationRowProps) {
  const isUnread = item.type === "suggestion_answered" && item.unread;
  const reason =
    item.type === "suggestion_answered" && !item.accepted ? declineReasonLabel(item.reason) : null;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
      >
        <span className="relative shrink-0">
          <span className="relative block h-10 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            {item.actor.avatarUrl ? (
              <Image src={item.actor.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              <User className="m-2.5 h-5 w-5 text-zinc-500" aria-hidden="true" />
            )}
          </span>
          <span
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900 ${
              item.type === "suggestion_answered" && !item.accepted
                ? "bg-zinc-500 text-white dark:bg-zinc-600"
                : "bg-amber-500 text-zinc-900"
            }`}
          >
            <NotificationIcon item={item} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-zinc-700 wrap-anywhere dark:text-zinc-300">
            <NotificationText item={item} />
          </span>
          {reason && (
            <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="sr-only">Motif : </span>
              {reason}
            </span>
          )}
          <time
            dateTime={item.createdAt}
            className="block text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatRelativeTime(new Date(item.createdAt), now)}
          </time>
        </span>
        {isUnread && (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500">
            <span className="sr-only">Non lue</span>
          </span>
        )}
      </Link>
    </li>
  );
}
