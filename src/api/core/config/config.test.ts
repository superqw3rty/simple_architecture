import { afterEach, describe, expect, it, vi } from 'vitest';

// API_URL is read once on import, so every case stubs the env and imports a fresh module.
const loadApiUrl = async (): Promise<string> => {
  vi.resetModules();
  const { API_URL } = await import('./config');
  return API_URL;
};

describe('API_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is empty when VITE_API_URL is not set, so requests go through the Vite proxy', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await expect(loadApiUrl()).resolves.toBe('');
  });

  it('is the deployed API origin when VITE_API_URL is set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');

    await expect(loadApiUrl()).resolves.toBe('https://api.example.test');
  });
});
