import type {
  ApiSuccessResponse,
  NewsBreakingData,
  NewsBreakingRequest,
  NewsDigestData,
  NewsDigestRequest,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";

/** S13 AI endpoints (both count toward the API's AI rate limit). */
const BREAKING_DIGEST_URLS = {
  BREAKING: "/news/breaking",
  DIGEST: "/news/digest",
} as const;

/** Breaking mode: the X post, the ticker line and the follower alert for one feed item. */
export async function getBreakingOutputs(body: NewsBreakingRequest, signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<NewsBreakingData>>(BREAKING_DIGEST_URLS.BREAKING, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
    signal,
  });
  return response.data;
}

/** «اللي فاتك»: the top stories since the previous visit (the API caches it 10 minutes per `since` hour). */
export async function getNewsDigest(body: NewsDigestRequest, signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<NewsDigestData>>(BREAKING_DIGEST_URLS.DIGEST, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
    signal,
  });
  return response.data;
}
