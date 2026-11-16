import { useQuery } from "@tanstack/react-query";
import type { TBilanResponse } from "@/types/bilan.type";

async function fetchBilan(year: number | null): Promise<TBilanResponse> {
  const url = year === null ? "/api/me/bilan" : `/api/me/bilan?year=${year}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} failed with status ${res.status}`);
  return res.json();
}

export function useBilanQuery(year: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["me", "bilan", year ?? "all"],
    queryFn: () => fetchBilan(year),
    enabled,
  });
}
