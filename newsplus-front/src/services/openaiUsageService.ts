import type { ApiSuccessResponse, OpenAIUsageData, OpenAIUsageQuery } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";

export async function getOpenAIUsage(query: OpenAIUsageQuery, signal?: AbortSignal): Promise<OpenAIUsageData> {
  const response = await apiRequest<ApiSuccessResponse<OpenAIUsageData>>("/openai/usage", {
    auth: true, params: { start: query.start, end: query.end, ...(query.project ? { project: query.project } : {}) }, signal,
  });
  return response.data;
}
