import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { shouldRetry } from './queryClient';

describe('shouldRetry', () => {
  it('retries network and server failures up to two times', () => {
    const network = new ApiError('Network error', 0);
    const server = new ApiError('Server error', 503);

    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, server)).toBe(true);
    expect(shouldRetry(2, server)).toBe(false);
  });

  it('never retries a client error', () => {
    expect(shouldRetry(0, new ApiError('Not found', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('Too many requests', 429))).toBe(false);
  });

  it('retries unknown errors like network ones', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(true);
  });
});
