import PersonService from "@/features/PersonMovieCredits/services/person.service";
import { useQuery } from "@tanstack/react-query";

export const useGetPersonMovieCreditsQuery = (personId: number) => {
  return useQuery({
    queryKey: ["person", "movie-credits", personId],
    queryFn: () => PersonService.fetchMovieCredits(personId),
    enabled: personId > 0,
  });
};
