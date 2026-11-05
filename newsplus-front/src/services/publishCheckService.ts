import type { ApiSuccessResponse, PublishCheckData, PublishCheckRequest } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

/**
 * S12 «فحص قبل النشر»: the checks of the conversation's current version. The API caches them per version; only a
 * version it has not checked yet counts toward the AI rate limit.
 */
export async function checkEditorialPublish(conversationId: string, body: PublishCheckRequest, signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<PublishCheckData>>(`${API_URLS.EDITORIAL.CONVERSATION(conversationId)}/check`, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
    signal,
  });
  return response.data;
}
