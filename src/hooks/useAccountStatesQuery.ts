import { useQuery } from "@tanstack/react-query";

export type TAccountStates = {
  watchlist: boolean;
  favorite: boolean;
  rated: boolean | { value: number };
};

async function fetchAccountStates(
  movieId: number
): Promise<TAccountStates> {
  const res = await fetch(`/api/movies/${movieId}/account-states`, {
    credentials: "include",
  });
  const data = await res.json();
  return {
    watchlist: data.watchlist ?? false,
    favorite: data.favorite ?? false,
    rated: data.rated ?? false,
  };
}

export function useAccountStatesQuery(movieId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["account-states", movieId],
    queryFn: () => fetchAccountStates(movieId),
    enabled: enabled && movieId > 0,
  });
}
