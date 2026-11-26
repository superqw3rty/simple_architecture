export const TV_MAZE_BASE_URL = 'https://api.tvmaze.com';

/** A hanging TVmaze must not hang our requests: after this, the call fails as UpstreamError. */
export const TV_MAZE_TIMEOUT_MS = 10_000;
