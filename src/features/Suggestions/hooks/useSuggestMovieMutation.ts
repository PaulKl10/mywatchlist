import { useMutation, useQueryClient } from "@tanstack/react-query";

type SuggestMovieParams = {
  receiverId: string;
  tmdbMovieId: number;
  media_type?: "movie" | "tv";
  title: string;
  poster_path?: string | null;
};

async function suggestMovie(params: SuggestMovieParams): Promise<void> {
  const res = await fetch("/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to suggest movie");
  }
}

export function useSuggestMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suggestMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}
