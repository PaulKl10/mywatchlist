import { useMutation, useQueryClient } from "@tanstack/react-query";

async function acceptSuggestion(suggestionId: string): Promise<void> {
  const res = await fetch(`/api/suggestions/${suggestionId}`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to accept suggestion");
  }
}

export function useAcceptSuggestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}
