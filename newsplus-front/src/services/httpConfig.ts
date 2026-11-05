import type { ApiFailResponse } from "@newsplus/shared";
import { startAiCooldown } from "./aiCooldown";
import { ApiError } from "./apiError";
import { expireSession, getAccessToken } from "./sessionStore";
import { baseURL } from "./urls";

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  auth?: boolean;
  /**
   * An AI route (`aiRateLimit` on the API): a 429 with `Retry-After` starts the app-wide AI cooldown (S10).
   * Set it on every call to a route behind `aiRateLimit`.
   */
  ai?: boolean;
};

function buildUrl(path: string, params?: Record<string, string>) {
  const base = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  return url;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as Partial<ApiFailResponse>;
    if (typeof body.message === "string" && body.message) return body.message;
  } catch {
    /* non-JSON */
  }
  return `request-failed-${response.status}`;
}

const WHOLE_NUMBER = /^\d+$/;

/** `Retry-After` is either delay-seconds or an HTTP date (RFC 9110 §10.2.3) → whole seconds from now. */
function parseRetryAfter(value: string | null): number | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (WHOLE_NUMBER.test(raw)) return Number(raw);
  const at = Date.parse(raw);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

function parseCount(value: string | null): number | undefined {
  const raw = value?.trim();
  return raw && WHOLE_NUMBER.test(raw) ? Number(raw) : undefined;
}

/**
 * S10: what a failed response means for the whole app. 401 with the token we sent (still the current one) →
 * «الجلسة انتهت»; requests sent without a token (the login itself) never get here. 429 from an AI route → the
 * AI cooldown.
 */
function onFailure(response: Response, error: ApiError, token: string | null, ai: boolean) {
  if (response.status === 401 && token && token === getAccessToken()) expireSession(token);
  if (ai && response.status === 429 && error.retryAfterSeconds !== undefined) startAiCooldown(error.retryAfterSeconds);
}

async function toApiError(response: Response) {
  return new ApiError(response.status, await readError(response), {
    retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
    rateLimitRemaining: parseCount(response.headers.get("X-RateLimit-Remaining")),
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, auth = false, ai = false, ...rest } = options;
  const token = auth ? getAccessToken() : null;
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (token && !requestHeaders.has("Authorization")) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl(path, params), {
    headers: requestHeaders,
    ...rest,
  });

  if (!response.ok) {
    const error = await toApiError(response);
    onFailure(response, error, token, ai);
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = await toApiError(response);
    onFailure(response, error, token, false);
    throw error;
  }
  return response.blob();
}
