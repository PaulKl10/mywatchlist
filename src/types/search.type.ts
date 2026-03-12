export type TMultiSearchMovie = {
  id: number;
  media_type: "movie";
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
};

export type TMultiSearchTv = {
  id: number;
  media_type: "tv";
  name: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
};

export type TMultiSearchPerson = {
  id: number;
  media_type: "person";
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    media_type: string;
    poster_path: string | null;
  }>;
};

export type TMultiSearchResult =
  | TMultiSearchMovie
  | TMultiSearchTv
  | TMultiSearchPerson;

export type TMultiSearchResponse = {
  page: number;
  results: TMultiSearchResult[];
  total_pages: number;
  total_results: number;
};
