import type { TvMazeSearchResponse } from '@/types/api/tvmaze';
import type { Show } from '@/types/show';
import { request } from '../http';
import { BASE_URL } from './config';
import { mapShow } from './mapShow';

/**
 * Finds shows by a free-text query. The server does the matching and returns
 * at most 10 shows, best match first.
 *
 * @param signal pass the one from useRequest so the call can be cancelled.
 * @throws ApiError on a network or server failure.
 */
export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  const results = await request<TvMazeSearchResponse>(`${BASE_URL}/search/shows`, {
    params: { q: query },
    signal,
  });

  return results.map((result) => mapShow(result.show));
}
