import type {
  ApiSuccessResponse,
  NewsFeedData,
  NewsSourcesData,
  NewsSummarizeData,
  NewsSummarizeRequest,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

export async function getNewsSources() {
  const response = await apiRequest<ApiSuccessResponse<NewsSourcesData>>(API_URLS.NEWS.SOURCES, {
    auth: true,
  });
  return response.data;
}

export async function getNewsFeed(source?: string, q?: string) {
  const params: Record<string, string> = {};
  if (source && source !== "all") params.source = source;
  if (q) params.q = q;
  const response = await apiRequest<ApiSuccessResponse<NewsFeedData>>(API_URLS.NEWS.FEED, {
    auth: true,
    params,
  });
  return response.data;
}

export async function summarizeNews(body: NewsSummarizeRequest) {
  const response = await apiRequest<ApiSuccessResponse<NewsSummarizeData>>(API_URLS.NEWS.SUMMARIZE, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
  return response.data;
}
