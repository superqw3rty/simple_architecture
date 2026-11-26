import { NotFoundError, UpstreamError } from '#server/error.ts';
import { TV_MAZE_BASE_URL, TV_MAZE_TIMEOUT_MS } from './constants.ts';

/**
 * GET from TVmaze. The only place on the server that calls fetch.
 * The caller names the response type: TVmaze's shape is trusted, mapShow tolerates missing fields.
 *
 * @param path starts with "/", query included: "/search/shows?q=murder".
 * @throws NotFoundError on 404; UpstreamError when TVmaze is unreachable, slow, fails or sends no JSON.
 */
export async function requestTvMaze<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${TV_MAZE_BASE_URL}${path}`, {
      signal: AbortSignal.timeout(TV_MAZE_TIMEOUT_MS),
    });
  } catch (error) {
    throw new UpstreamError(`TVmaze is unreachable: ${path}`, { cause: error });
  }

  if (response.status === 404) {
    throw new NotFoundError(`TVmaze: ${path} not found`);
  }
  if (!response.ok) {
    throw new UpstreamError(`TVmaze responded ${response.status}: ${path}`);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new UpstreamError(`TVmaze sent invalid JSON: ${path}`, { cause: error });
  }
}
