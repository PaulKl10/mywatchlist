import { useMutation, useQueryClient } from "@tanstack/react-query";

async function declineSuggestion(suggestionId: string): Promise<void> {
  const res = await fetch(`/api/suggestions/${suggestionId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to decline suggestion");
  }
}

export function useDeclineSuggestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}
