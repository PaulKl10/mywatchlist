import { useMutation, useQueryClient } from "@tanstack/react-query";

async function markNotificationsRead(until: string): Promise<void> {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ until }),
  });
  if (!res.ok) throw new Error(`POST /api/notifications/read failed with status ${res.status}`);
}

/** Marque comme lues les réponses affichées ; le badge suit, la liste ouverte garde son surlignage. */
export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "count"] }),
  });
}
