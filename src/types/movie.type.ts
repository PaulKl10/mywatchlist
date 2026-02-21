export type TMovie = {
  id: number;
  title: string;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type TDiscoverMoviesResponse = {
  page: number;
  results: TMovie[];
  total_pages: number;
  total_results: number;
};