/**
 * Origin of our own API, without a trailing slash and without `/api`: endpoints write the path.
 * Empty locally, so requests go to the page's origin and Vite proxies `/api` to `pnpm dev:server`.
 * The Pages build sets VITE_API_URL to the deployed API (hw2-plan, step 11).
 */
export const API_URL = import.meta.env.VITE_API_URL ?? '';
