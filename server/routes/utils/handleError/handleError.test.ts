import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, UpstreamError } from '#server/error.ts';
import { handleError } from './handleError.ts';

// A tiny app whose only route throws the given error.
function requestThrowing(error: Error): Promise<Response> {
  const testApp = new Hono();
  testApp.onError(handleError);
  testApp.get('/', () => {
    throw error;
  });
  return Promise.resolve(testApp.request('/'));
}

describe('handleError', () => {
  it('turns NotFoundError into 404', async () => {
    const response = await requestThrowing(new NotFoundError('TVmaze: /shows/1 not found'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'TVmaze: /shows/1 not found' });
  });

  it('turns UpstreamError into 502', async () => {
    const response = await requestThrowing(new UpstreamError('TVmaze is unreachable'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'TVmaze is unreachable' });
  });

  it('keeps the status of an HTTPException', async () => {
    const response = await requestThrowing(new HTTPException(400, { message: 'Empty term' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Empty term' });
  });

  it('hides an unknown error behind 500 and logs it', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new TypeError('secret details');

    const response = await requestThrowing(error);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(log).toHaveBeenCalledWith(error);
    log.mockRestore();
  });
});
