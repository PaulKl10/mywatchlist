export type TMovieNightStatus = "LOBBY" | "SWIPING" | "MATCH" | "ENDED";
export type TParticipantStatus = "INVITED" | "JOINED" | "DECLINED" | "LEFT" | "REMOVED";
export type TDeckMovie = {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
  runtime: number | null;
  genreIds: number[];
  overview: string;
  provider: { id: number; name: string; logoPath: string | null } | null;
  /**
   * Serveur seulement, enregistré dans la pile : participants qui ont ce film dans leur
   * watchlist (option « Piocher dans nos watchlists »). Jamais envoyé au client.
   */
  watchlistOf?: TWatchlistOwner[];
  /** Ce que le client reçoit à la place de `watchlistOf`, selon qui regarde (`presentDeckMovie`). */
  watchlist?: TWatchlistMention;
};
/** Participant connecté qui a un film de la pile dans sa watchlist. */
export type TWatchlistOwner = { userId: string; name: string };
/**
 * Qui a ce film dans sa watchlist, vu par un participant : lui-même, ses amis (nommés, car
 * leur watchlist lui est visible), et les autres (seulement comptés).
 */
export type TWatchlistMention = { me: boolean; friends: string[]; others: number };
export type TVote = { participantId: string; movieId: number; liked: boolean };
export type TParticipantLike = {
  id: string;
  status: TParticipantStatus;
  isHost: boolean;
  lastSeenAt: Date;
};
export type TPodiumEntry = { movie: TDeckMovie; yesCount: number; voterCount: number };
export type TParticipantView = {
  id: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  isHost: boolean;
  isGuest: boolean;
  isActive: boolean;
  votedCount: number;
  hasFinished: boolean;
};
export type TMovieNightSettings = {
  providerIds: number[];
  genreIds: number[];
  includeSeen: boolean;
  /** Films des watchlists des participants d'abord, la découverte complète la pile. */
  fromWatchlists: boolean;
};
export type TMovieNightState = {
  id: string;
  status: TMovieNightStatus;
  code: string | null; // seulement en LOBBY
  settings: TMovieNightSettings;
  me: { participantId: string; isHost: boolean; isGuest: boolean };
  canDecide: boolean;
  participants: TParticipantView[]; // statut JOINED uniquement
  invitedFriendIds: string[]; // ids User des amis au statut INVITED (vue hôte en LOBBY)
  round: { index: number; deck: TDeckMovie[] } | null;
  myVotes: Record<number, boolean>; // movieId → liked, pile courante
  pendingMatch: TDeckMovie | null;
  matches: TDeckMovie[]; // pile courante, ordre de la pile
  everyoneFinished: boolean;
  podium: TPodiumEntry[] | null; // non null seulement si everyoneFinished et aucun match
  chosenMovie: TDeckMovie | null;
};
export type TMovieNightInvite = {
  movieNightId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  createdAt: string;
};
export type TMovieNightDecision =
  | { action: "watch"; movieId: number }
  | { action: "continue"; movieId?: number }; // movieId : le match affiché, vérifié côté serveur
export type TStreamingProvider = { id: number; name: string; logoPath: string | null };
export type TMovieNightErrorCode =
  | "unauthorized"
  | "not_participant"
  | "not_found"
  | "forbidden"
  | "invalid_input"
  | "invalid_code"
  | "session_full"
  | "name_taken"
  | "wrong_status"
  | "match_pending"
  | "already_voted"
  | "not_friends"
  | "no_movies"
  | "not_finished";
