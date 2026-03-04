import { useMutation, useQueryClient } from "@tanstack/react-query";

async function removeFriend(friendTmdbId: number): Promise<void> {
  const res = await fetch(`/api/friends/${friendTmdbId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to remove friend");
  }
}

export function useRemoveFriendMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
