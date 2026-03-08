import { useQuery } from "@tanstack/react-query";
import type { TNotificationCount } from "@/app/api/notifications/count/route";

async function fetchNotificationCounts(): Promise<TNotificationCount> {
  const res = await fetch("/api/notifications/count", { credentials: "include" });
  const data = await res.json();
  return {
    friendRequests: data.friendRequests ?? 0,
    suggestions: data.suggestions ?? 0,
    total: data.total ?? 0,
  };
}

export function useNotificationCountsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "count"],
    queryFn: fetchNotificationCounts,
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true, // Rafraîchit au retour sur l'onglet
  });
}
