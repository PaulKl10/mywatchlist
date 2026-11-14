import { createRatingHandlers } from "@/lib/server/handlers/rating.handlers";
import { fetchMovieRuntime } from "@/lib/tmdb";

const handlers = createRatingHandlers({
  mediaType: "movie",
  invalidIdMessage: "Invalid movie ID",
  fetchRuntime: fetchMovieRuntime,
});

export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
