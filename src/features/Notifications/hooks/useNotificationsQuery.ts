import { useQuery } from "@tanstack/react-query";
import type { TNotificationItem } from "@/types/notification.type";

async function fetchNotifications(): Promise<TNotificationItem[]> {
  const res = await fetch("/api/notifications", { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/notifications failed with status ${res.status}`);
  const data: { items?: TNotificationItem[] } = await res.json();
  return data.items ?? [];
}

/** Liste du panneau de notifications, relue à chaque ouverture. */
export function useNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: fetchNotifications,
    enabled,
    staleTime: 0,
  });
}
