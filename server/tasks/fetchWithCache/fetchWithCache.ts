import { requestTvMaze } from '#server/tvmaze/request.ts';
import { getOrLoad } from '../getOrLoad/index.ts';

// Business rule (HW-2): the same TVmaze request goes out at most once in 5 minutes.
const TV_MAZE_TTL_MS = 5 * 60 * 1000;

export function fetchWithCache<T>(path: string, now?: number): Promise<T> {
  return getOrLoad({
    key: `tvmaze:${path}`,
    ttlMs: TV_MAZE_TTL_MS,
    load: () => requestTvMaze<T>(path),
    now,
  });
}
