import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Gift, User, UserPlus, type LucideIcon } from "lucide-react";
import { formatRelativeTime } from "@/features/Activity/utils/relativeTime";
import type { TNotificationItem, TNotificationType } from "@/types/notification.type";

const TYPE_ICONS: Record<TNotificationType, LucideIcon> = {
  movie_night_invite: Clapperboard,
  friend_request: UserPlus,
  suggestion: Gift,
};

function NotificationText({ item }: { item: TNotificationItem }) {
  const name = (
    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.actor.name}</span>
  );
  switch (item.type) {
    case "movie_night_invite":
      return <>{name} vous invite à « Ce soir ? »</>;
    case "friend_request":
      return <>{name} vous a demandé en ami</>;
    case "suggestion":
      return (
        <>
          {name} vous propose {item.mediaType === "tv" ? "la série" : "le film"}{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">« {item.title} »</span>
        </>
      );
  }
}

interface NotificationRowProps {
  item: TNotificationItem;
  now: Date;
  onNavigate: () => void;
}

/** Ligne du panneau : avatar de l'ami, pictogramme du type, texte et date ; mène à la page où traiter. */
export function NotificationRow({ item, now, onNavigate }: NotificationRowProps) {
  const Icon = TYPE_ICONS[item.type];

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
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-zinc-900 ring-2 ring-white dark:ring-zinc-900">
            <Icon className="h-3 w-3" aria-hidden="true" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-zinc-700 wrap-anywhere dark:text-zinc-300">
            <NotificationText item={item} />
          </span>
          <time dateTime={item.createdAt} className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatRelativeTime(new Date(item.createdAt), now)}
          </time>
        </span>
      </Link>
    </li>
  );
}
