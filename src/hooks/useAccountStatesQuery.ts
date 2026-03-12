import { useQuery } from "@tanstack/react-query";

export type TAccountStates = {
  watchlist: boolean;
  favorite: boolean;
  rated: boolean | { value: number };
};

async function fetchAccountStates(
  mediaId: number,
  mediaType: "movie" | "tv"
): Promise<TAccountStates> {
  const base = mediaType === "tv" ? "/api/tv" : "/api/movies";
  const res = await fetch(`${base}/${mediaId}/account-states`, {
    credentials: "include",
  });
  const data = await res.json();
  return {
    watchlist: data.watchlist ?? false,
    favorite: data.favorite ?? false,
    rated: data.rated ?? false,
  };
}

export function useAccountStatesQuery(
  mediaId: number,
  enabled: boolean,
  mediaType: "movie" | "tv" = "movie"
) {
  return useQuery({
    queryKey: ["account-states", mediaType, mediaId],
    queryFn: () => fetchAccountStates(mediaId, mediaType),
    enabled: enabled && mediaId > 0,
  });
}
