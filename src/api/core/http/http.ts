import { ApiError, isAbortError } from '../ApiError';
import { API_URL } from '../config';

type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestConfig {
  method?: 'GET' | 'PUT' | 'DELETE';
  params?: QueryParams;
  /** Sent as JSON. Leave it out for a request without a body. */
  body?: unknown;
  signal?: AbortSignal;
}

/** Our endpoints pass a path ('/api/shows') and get API_URL in front; absolute URLs go as is. */
function buildUrl(url: string, params: QueryParams = {}): string {
  const base = url.startsWith('/') ? `${API_URL}${url}` : url;
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(name, String(value));
    }
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * The only place in the app that touches `fetch`.
 * Resolves with parsed JSON, rejects with ApiError. AbortError is rethrown untouched.
 */
export async function request<T>(
  url: string,
  { method = 'GET', params, body, signal }: RequestConfig = {},
): Promise<T> {
  let response: Response;

  try {
    // `=== undefined`, not `!body`: 0, false, '' and null are valid JSON bodies.
    const hasBody = body !== undefined;
    response = await fetch(buildUrl(url, params), {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    });
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
