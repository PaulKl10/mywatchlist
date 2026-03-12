import axios from "axios";

const RatingService = {
  addRating: async (
    mediaId: number,
    value: number,
    mediaType: "movie" | "tv" = "movie",
    runtime?: number | null
  ): Promise<void> => {
    const base = mediaType === "tv" ? "/api/tv" : "/api/movies";
    await axios.post(
      `${base}/${mediaId}/rating`,
      { value, runtime: mediaType === "movie" ? (runtime ?? undefined) : undefined },
      { withCredentials: true }
    );
  },

  removeRating: async (
    mediaId: number,
    mediaType: "movie" | "tv" = "movie"
  ): Promise<void> => {
    const base = mediaType === "tv" ? "/api/tv" : "/api/movies";
    await axios.delete(`${base}/${mediaId}/rating`, {
      withCredentials: true,
    });
  },
};

export default RatingService;
