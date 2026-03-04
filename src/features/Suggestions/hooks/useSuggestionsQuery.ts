import { useQuery } from "@tanstack/react-query";
import type { TSuggestion } from "@/app/api/suggestions/route";

async function fetchSuggestions(): Promise<TSuggestion[]> {
  const res = await fetch("/api/suggestions", { credentials: "include" });
  const data = await res.json();
  return data.suggestions ?? [];
}

export function useSuggestionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["suggestions"],
    queryFn: fetchSuggestions,
    enabled,
  });
}
