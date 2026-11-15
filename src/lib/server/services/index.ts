export {
  SESSION_COOKIE,
  getSessionId,
  getUserFromSessionId,
  getCurrentSession,
  type TCurrentSession,
} from "./session.service";
export {
  getWatchTimeStats,
  recordWatchTime,
  removeWatchTime,
  type TWatchTimeStats,
} from "./watchTime.service";
export { getFriendsWatchlistMovies } from "./friendsWatchlist.service";
export { syncWatchlistItem, updateTmdbWatchlist } from "./watchlist.service";
export {
  getSuggestions,
  createSuggestion,
  type TSuggestion,
  type CreateSuggestionInput,
} from "./suggestions.service";
export {
  getFriends,
  getFriendIds,
  addFriend,
  findAcceptedFriendship,
  type TFriend,
  type TAddFriendResult,
} from "./friends.service";
export {
  fetchFrenchStreamingProviders,
  getSeenMovieIds,
  buildDeck,
} from "./movieNightDeck.service";
