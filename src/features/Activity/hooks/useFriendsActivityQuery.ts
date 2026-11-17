import { useQuery } from "@tanstack/react-query";
import type { TActivityItem } from "@/types/activity.type";

export type TFriendsActivity = { items: TActivityItem[]; hasFriends: boolean };

export const FRIENDS_ACTIVITY_KEY = ["friends", "activity"] as const;

async function fetchFriendsActivity(): Promise<TFriendsActivity> {
  const res = await fetch("/api/friends/activity", { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/friends/activity failed with status ${res.status}`);
  return res.json();
}

export function useFriendsActivityQuery(enabled: boolean) {
  return useQuery({
    queryKey: FRIENDS_ACTIVITY_KEY,
    queryFn: fetchFriendsActivity,
    enabled,
  });
}
