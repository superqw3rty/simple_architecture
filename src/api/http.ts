import { ApiError, isAbortError } from './ApiError';

type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestConfig {
  params?: QueryParams;
  signal?: AbortSignal;
}

function buildUrl(url: string, params: QueryParams = {}): string {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(name, String(value));
    }
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * The only place in the app that touches `fetch`.
 * Resolves with parsed JSON, rejects with ApiError. AbortError is rethrown untouched.
 */
export async function request<T>(url: string, { params, signal }: RequestConfig = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(url, params), { signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('Network error. Check your connection and try again.', 0, { cause: error });
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('Server returned an unreadable response.', response.status, {
      cause: error,
    });
  }
}
