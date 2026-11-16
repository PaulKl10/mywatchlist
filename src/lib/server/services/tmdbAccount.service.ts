import { tmdbClient } from "@/lib/tmdb-client";
import type { TCurrentSession } from "./session.service";

/** TMDB trie les listes du compte du plus ancien au plus récent par défaut. */
const NEWEST_FIRST = "created_at.desc";
/** Pages TMDB demandées en parallèle. */
const PAGE_CONCURRENCY = 5;

type TAccountListPage<T> = { results: T[]; total_pages: number };

export type TAccountList<T> = {
  /** Du plus récent au plus ancien ajout. */
  items: T[];
  /** false si des pages n'ont pas été lues (liste plus longue que `maxPages`). */
  complete: boolean;
};

/**
 * Liste du compte TMDB connecté (ex. `watchlist/movies`, `rated/tv`), lue page par page
 * (20 éléments par page) et bornée à `maxPages`.
 */
export async function fetchAccountList<T>(
  { sessionId, user }: TCurrentSession,
  list: string,
  maxPages: number
): Promise<TAccountList<T>> {
  const path = `/account/${user.tmdb_id}/${list}`;
  const fetchPage = (page: number) =>
    tmdbClient.get<TAccountListPage<T>>(path, {
      session_id: sessionId,
      page,
      language: "fr-FR",
      sort_by: NEWEST_FIRST,
    });

  const first = await fetchPage(1);
  const lastPage = Math.min(first.total_pages, maxPages);
  const items = [...first.results];

  for (let start = 2; start <= lastPage; start += PAGE_CONCURRENCY) {
    const end = Math.min(start + PAGE_CONCURRENCY - 1, lastPage);
    const pages = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => fetchPage(start + i))
    );
    for (const page of pages) items.push(...page.results);
  }

  return { items, complete: first.total_pages <= maxPages };
}
