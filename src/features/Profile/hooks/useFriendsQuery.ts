import { useQuery } from "@tanstack/react-query";

export type TFriend = {
  id: string;
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

async function fetchFriends(): Promise<TFriend[]> {
  const res = await fetch("/api/friends", { credentials: "include" });
  const data = await res.json();
  return data.friends ?? [];
}

export function useFriendsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
    enabled,
  });
}
