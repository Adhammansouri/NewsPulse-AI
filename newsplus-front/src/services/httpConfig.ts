import type { ApiFailResponse } from "@newsplus/shared";
import { ApiError } from "./apiError";
import { getAccessToken } from "./sessionStore";
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

  const response = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  return response.json() as Promise<T>;
}