import type { ShowsPage } from '#shared';
import { request } from '../../core/http';

/** What a results page depends on. All of it goes into the query key (showQueries.page). */
export interface ShowsPageParams {
  /** Trimmed and debounced; never empty, the query is disabled before that. */
  term: string;
  /** null means all genres. */
  genre: string | null;
  /** 1-based. The server clamps it, so read the real page from the response. */
  page: number;
}

/**
 * One page of search results from our API: TVmaze search, genre filter and pagination
 * are done on the server (D-58). Genre counts cover the whole search.
 *
 * @param signal pass the one from the query context (see showQueries) so the call can be cancelled.
 * @throws ApiError on a network or server failure.
 */
export function fetchShowsPage(
  { term, genre, page }: ShowsPageParams,
  signal?: AbortSignal,
): Promise<ShowsPage> {
  return request<ShowsPage>('/api/shows', {
    // No genre → no `genre=` in the URL: the server reads an absent genre as "all".
    params: { q: term, genre: genre ?? undefined, page },
    signal,
  });
}
