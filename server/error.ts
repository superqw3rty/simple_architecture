// Domain errors say what happened, not which HTTP status to send:
// routes/utils/handleError turns them into responses, so lower layers never import Hono.

// The thing asked for does not exist (TVmaze answered 404).
export class NotFoundError extends Error {
  override name = 'NotFoundError';
}

// TVmaze is unreachable, too slow, failed or sent no JSON.
export class UpstreamError extends Error {
  override name = 'UpstreamError';
}
