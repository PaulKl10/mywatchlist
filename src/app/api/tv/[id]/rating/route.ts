import { createRatingHandlers } from "@/lib/server/handlers/rating.handlers";
import { fetchTvTotalRuntime } from "@/lib/tmdb";

const handlers = createRatingHandlers({
  mediaType: "tv",
  invalidIdMessage: "Invalid TV series ID",
  fetchRuntime: fetchTvTotalRuntime,
});

export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
