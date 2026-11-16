import { useQuery } from "@tanstack/react-query";
import type { TActivityItem } from "@/types/activity.type";

type TFriendsActivity = { items: TActivityItem[]; hasFriends: boolean };

async function fetchFriendsActivity(): Promise<TFriendsActivity> {
  const res = await fetch("/api/friends/activity", { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/friends/activity failed with status ${res.status}`);
  return res.json();
}

export function useFriendsActivityQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["friends", "activity"],
    queryFn: fetchFriendsActivity,
    enabled,
  });
}
