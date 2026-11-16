import type { TDeckMovie } from "./types";

/**
 * Film tel qu'envoyé à un participant : `watchlistOf` (qui a ce film dans sa watchlist) est
 * remplacé par `watchlist`. Seuls le participant lui-même et ses amis sont nommés : une
 * watchlist n'est visible que par les amis, un invité ou un inconnu ne voit qu'un nombre.
 */
export function presentDeckMovie(
  movie: TDeckMovie,
  viewerUserId: string | null,
  viewerFriendIds: ReadonlySet<string>
): TDeckMovie {
  const { watchlistOf, ...rest } = movie;
  if (!watchlistOf || watchlistOf.length === 0) return rest;

  let me = false;
  const friends: string[] = [];
  let others = 0;
  for (const owner of watchlistOf) {
    if (owner.userId === viewerUserId) me = true;
    else if (viewerFriendIds.has(owner.userId)) friends.push(owner.name);
    else others += 1;
  }
  return { ...rest, watchlist: { me, friends, others } };
}

/** Vrai si un film de ces piles vient des watchlists (il faut alors les amis de qui regarde). */
export function hasWatchlistOwners(movies: TDeckMovie[]): boolean {
  return movies.some((movie) => (movie.watchlistOf?.length ?? 0) > 0);
}
