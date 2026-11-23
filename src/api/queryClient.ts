import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './ApiError';

/** Retries after the first failure. Total attempts = MAX_RETRIES + 1. */
const MAX_RETRIES = 2;

/**
 * A 4xx means the request itself is wrong: asking again gives the same answer.
 * Network failures (status 0) and 5xx are worth another try.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

/**
 * The QueryClient with the app-wide defaults. Per-query settings (staleTime, enabled)
 * live in the query factories next to the endpoints, e.g. showQueries.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // Search results do not change while the user switches tabs.
        refetchOnWindowFocus: false,
      },
    },
  });
}
