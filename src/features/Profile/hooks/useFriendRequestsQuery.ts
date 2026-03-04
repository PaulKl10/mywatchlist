import { useQuery } from "@tanstack/react-query";

export type TFriendRequest = {
  id: string;
  sender: {
    id: string;
    tmdb_id: number;
    username: string | null;
    gravatar_hash: string | null;
    tmdb_avatar_path: string | null;
  };
};

async function fetchFriendRequests(): Promise<TFriendRequest[]> {
  const res = await fetch("/api/friends/requests", { credentials: "include" });
  const data = await res.json();
  return data.requests ?? [];
}

export function useFriendRequestsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["friends", "requests"],
    queryFn: fetchFriendRequests,
    enabled,
  });
}
