// API contract: the body of every non-2xx response (400, 404, 502).
// The text is for developers; the UI never shows it.
export interface ApiErrorBody {
  error: string;
}
