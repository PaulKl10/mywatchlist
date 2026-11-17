import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TDeclineReason } from "@/lib/suggestions/declineReasons";

type TDeclineInput = { suggestionId: string; reason: TDeclineReason };

async function declineSuggestion({ suggestionId, reason }: TDeclineInput): Promise<void> {
  const res = await fetch(`/api/suggestions/${suggestionId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Impossible de refuser la suggestion");
  }
}

export function useDeclineSuggestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
