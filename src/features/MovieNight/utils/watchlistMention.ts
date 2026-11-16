import type { TWatchlistMention } from "@/lib/movie-night/types";

/** « Léa », « Léa et Tom », « Léa, Tom et Max ». */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/**
 * Mention d'une carte de « Ce soir ? » : qui a ce film dans sa watchlist. Les amis sont
 * nommés ; dès qu'un propriétaire n'en est pas un, seul le nombre est donné.
 */
export function formatWatchlistMention(mention: TWatchlistMention | undefined): string | null {
  if (!mention) return null;
  const { me, friends, others } = mention;
  const total = (me ? 1 : 0) + friends.length + others;
  if (total === 0) return null;

  if (others > 0) {
    if (total === 1) return "Dans la watchlist d'un participant";
    return `Dans ${total} watchlists du groupe${me ? ", dont la tienne" : ""}`;
  }
  if (!me) {
    return friends.length === 1
      ? `Dans la watchlist de ${friends[0]}`
      : `Dans les watchlists de ${joinNames(friends)}`;
  }
  if (friends.length === 0) return "Dans ta watchlist";
  return `Dans ta watchlist et ${friends.length === 1 ? "celle" : "celles"} de ${joinNames(friends)}`;
}
