/**
 * Identifies a request. Everything the response depends on must be in the key.
 * Convention: [entity, action, ...params], e.g. ['shows', 'search', 'batman'].
 */
export type RequestKey = readonly unknown[];

export interface RequestContext {
  /** Aborted when nobody needs the response anymore. Pass it down to the API function. */
  signal: AbortSignal;
}

export type RequestFn<T> = (context: RequestContext) => Promise<T>;

/**
 * - idle: the request is disabled and there is no cached data
 * - pending: no data yet, the first load is in progress
 * - success: data is available (it may be refreshing in the background, see isFetching)
 * - error: the last attempt failed and there is no data
 */
export type RequestStatus = 'idle' | 'pending' | 'success' | 'error';

/** Mirrors the TanStack Query option names: key = queryKey, fn = queryFn. */
export interface RequestOptions<T> {
  key: RequestKey;
  fn: RequestFn<T>;
  /** When false the request is not sent. Default: true. */
  enabled?: boolean;
  /** How long cached data is served without a network call, ms. Default: 0. */
  staleTime?: number;
}

export interface RequestResult<T> {
  /** Last successfully loaded data for the current key. */
  data: T | undefined;
  /** Error of the last attempt, null otherwise. */
  error: Error | null;
  status: RequestStatus;
  /** A network call is in flight right now: the first load or a background refresh. */
  isFetching: boolean;
  /** Loads again ignoring staleTime. */
  refetch: () => void;
}

/** One record of the cache. Records are immutable: every change replaces the object. */
export interface CacheEntry<T = unknown> {
  status: 'pending' | 'success' | 'error';
  data: T | undefined;
  error: Error | null;
  /** Date.now() of the last settled response; 0 means "stale, reload on next use". */
  updatedAt: number;
  isFetching: boolean;
  /** Controller of the request in flight. Also serves as the identity of that request. */
  controller: AbortController | null;
}
