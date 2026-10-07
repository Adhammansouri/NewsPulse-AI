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
    throw new ApiError(response.status, await readError(response));
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
    throw new ApiError(response.status, await readError(response));
  }
  return response.blob();
}
