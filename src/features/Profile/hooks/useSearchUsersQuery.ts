import { useQuery } from "@tanstack/react-query";

export type TSearchUser = {
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

async function searchUsers(query: string): Promise<TSearchUser[]> {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `/api/users/search?q=${encodeURIComponent(query.trim())}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.users ?? [];
}

export function useSearchUsersQuery(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => searchUsers(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
  });
}
