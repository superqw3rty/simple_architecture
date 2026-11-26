import { describe, expect, it } from 'vitest';
import { app } from './app.ts';

describe('app', () => {
  it('answers the health check under /api', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
