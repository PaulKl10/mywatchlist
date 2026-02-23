import axios from "axios";

const RatingService = {
  addRating: async (movieId: number, value: number): Promise<void> => {
    await axios.post(
      `/api/movies/${movieId}/rating`,
      { value },
      { withCredentials: true }
    );
  },

  removeRating: async (movieId: number): Promise<void> => {
    await axios.delete(`/api/movies/${movieId}/rating`, {
      withCredentials: true,
    });
  },
};

export default RatingService;
