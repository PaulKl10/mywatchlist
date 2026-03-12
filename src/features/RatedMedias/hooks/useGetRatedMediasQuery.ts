import RatedMediasService from "@/features/RatedMedias/services/rated-medias.service";
import { useQuery } from "@tanstack/react-query";

export const useGetRatedMoviesQuery = (page = 1) => {
  return useQuery({
    queryKey: ["rated-movies", "movie", page],
    queryFn: () => RatedMediasService.fetchRatedMovies(page),
  });
};

export const useGetRatedTvQuery = (page = 1) => {
  return useQuery({
    queryKey: ["rated-movies", "tv", page],
    queryFn: () => RatedMediasService.fetchRatedTv(page),
  });
};
