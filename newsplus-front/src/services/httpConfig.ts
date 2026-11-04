import type { ApiFailResponse } from "@newsplus/shared";
import { ApiError } from "./apiError";
import { clearSession, getAccessToken } from "./sessionStore";
import { baseURL } from "./urls";

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  auth?: boolean;
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

async function toApiError(response: Response) {
  return new ApiError(response.status, await readError(response), {
    retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
    rateLimitRemaining: parseCount(response.headers.get("X-RateLimit-Remaining")),
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, auth = false, ...rest } = options;
  const token = auth ? getAccessToken() : null;
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (token && !requestHeaders.has("Authorization")) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl(path, params), {
    headers: requestHeaders,
    ...rest,
  });

  if (!response.ok) {
    if (response.status === 401 && token && token === getAccessToken()) clearSession();
    throw await toApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    if (response.status === 401 && token && token === getAccessToken()) clearSession();
    throw await toApiError(response);
  }
  return response.blob();
}
