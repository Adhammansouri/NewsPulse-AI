/** Rate-limit details an error response can carry (login in S03, AI routes in S10). */
export type ApiErrorMeta = {
  /** `Retry-After`, in whole seconds from when the response arrived (sent with 429). */
  retryAfterSeconds?: number;
  /** `X-RateLimit-Remaining`: requests left in the current rate-limit window. */
  rateLimitRemaining?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Present only when the response sent a valid `Retry-After` header. */
  readonly retryAfterSeconds?: number;
  /** Present only when the response sent a valid `X-RateLimit-Remaining` header. */
  readonly rateLimitRemaining?: number;

  constructor(status: number, code: string, meta: ApiErrorMeta = {}) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = meta.retryAfterSeconds;
    this.rateLimitRemaining = meta.rateLimitRemaining;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
