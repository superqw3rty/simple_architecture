/** Any failed HTTP exchange. `status` is 0 when the request never reached the server. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';
