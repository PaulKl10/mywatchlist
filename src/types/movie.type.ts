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

export type TGenre = {
  id: number;
  name: string;
};

export type TMovieDetails = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: TGenre[];
  tagline: string | null;
  homepage: string | null;
};

export type TWatchProvider = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
};

export type TWatchProviders = {
  link: string;
  flatrate: TWatchProvider[];
  buy: TWatchProvider[];
  rent: TWatchProvider[];
};

export type TCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TMovieCredits = {
  cast: TCastMember[];
};

export type TPersonDetails = {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string | null;
};

export type TPersonMovieCredit = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  character: string;
};

export type TPersonMovieCredits = {
  cast: TPersonMovieCredit[];
};