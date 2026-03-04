"use client";

import { useAuth } from "@/providers/AuthProvider";
import { MovieRow } from "@/features/Home/components/MovieRow";
import { usePopularMoviesQuery } from "@/features/Home/hooks/usePopularMoviesQuery";
import { useGenreMoviesQuery } from "@/features/Home/hooks/useGenreMoviesQuery";
import { useFriendsWatchlistQuery } from "@/features/Home/hooks/useFriendsWatchlistQuery";

const HOME_GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comédie" },
  { id: 878, name: "Science-Fiction" },
  { id: 18, name: "Drame" },
  { id: 27, name: "Horreur" },
  { id: 10749, name: "Romance" },
];

function GenreRow({ genreId, genreName }: { genreId: number; genreName: string }) {
  const { data, isLoading } = useGenreMoviesQuery(genreId);
  return (
    <MovieRow
      title={genreName}
      movies={data?.results ?? []}
      isLoading={isLoading}
      exploreHref={`/discover?with_genres=${genreId}`}
    />
  );
}

export function HomeView() {
  const { user } = useAuth();
  const { data: popularData, isLoading: popularLoading } =
    usePopularMoviesQuery();
  const friendsQuery = useFriendsWatchlistQuery(!!user);

  return (
    <div className="flex flex-col gap-4 pb-12 md:pl-24">
      <MovieRow
        title="Populaires"
        movies={popularData?.results ?? []}
        isLoading={popularLoading}
        exploreHref="/discover"
      />

      {HOME_GENRES.map((genre: (typeof HOME_GENRES)[number]) => (
        <GenreRow
          key={genre.id}
          genreId={genre.id}
          genreName={genre.name}
        />
      ))}

      {user && (
        <MovieRow
          title="Dans les watchlists de mes amis"
          movies={friendsQuery.data ?? []}
          isLoading={friendsQuery.isLoading}
        />
      )}
    </div>
  );
}
