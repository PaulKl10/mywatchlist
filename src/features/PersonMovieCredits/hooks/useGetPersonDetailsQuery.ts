import PersonService from "@/features/PersonMovieCredits/services/person.service";
import { useQuery } from "@tanstack/react-query";

export const useGetPersonDetailsQuery = (personId: number) => {
  return useQuery({
    queryKey: ["person", "details", personId],
    queryFn: () => PersonService.fetchPersonDetails(personId),
    enabled: personId > 0,
  });
};
