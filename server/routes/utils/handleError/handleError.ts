import { NotFoundError, UpstreamError } from '#server/error.ts';
import type { ApiErrorBody } from '#shared';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';

// The one place where errors become HTTP statuses: routes and tasks need no try/catch.
// An unknown error is a bug of ours, so its details stay in the log, not in the response.
export function handleError(error: Error, c: Context): Response {
  if (error instanceof NotFoundError) {
    return c.json<ApiErrorBody>({ error: error.message }, 404);
  }
  if (error instanceof UpstreamError) {
    return c.json<ApiErrorBody>({ error: error.message }, 502);
  }
  if (error instanceof HTTPException) {
    return c.json<ApiErrorBody>({ error: error.message }, error.status);
  }
  console.error(error);
  return c.json<ApiErrorBody>({ error: 'Internal server error' }, 500);
}
