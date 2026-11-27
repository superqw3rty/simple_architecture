import { describe, expect, it } from 'vitest';
import { ApiError, isAbortError } from './ApiError';

describe('ApiError', () => {
  it('carries the status and is recognisable by name', () => {
    const error = new ApiError('Request failed with status 503.', 503);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'ApiError', status: 503 });
  });

  it('has status 0 when the request never reached the server', () => {
    expect(new ApiError('Network error').status).toBe(0);
  });
});

describe('isAbortError', () => {
  it('is true only for a DOMException named AbortError', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new DOMException('Timed out', 'TimeoutError'))).toBe(false);
    expect(isAbortError(new Error('AbortError'))).toBe(false);
  });
});
