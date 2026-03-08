import { useMutation, useQueryClient } from "@tanstack/react-query";

async function respondToRequest(
  friendshipId: string,
  action: "accept" | "decline"
): Promise<void> {
  const res = await fetch("/api/friends/requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ friendshipId, action }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to respond");
  }
}

export function useRespondToFriendRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId, action }: { friendshipId: string; action: "accept" | "decline" }) =>
      respondToRequest(friendshipId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}
