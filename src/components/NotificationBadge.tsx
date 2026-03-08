"use client";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-amber-500 dark:text-zinc-900 ${className}`}
      aria-label={`${count} notification${count > 1 ? "s" : ""}`}
    >
      {display}
    </span>
  );
}
