// Env variables the client reads. Without this, vite/client types every VITE_* as `any`.
interface ImportMetaEnv {
  // Origin of our API for the Pages build. Unset locally: Vite proxies /api.
  readonly VITE_API_URL?: string;
}
