import type { ApiSuccessResponse, GenerateData, GenerateRequest } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

/** `signal` lets the mobile «إلغاء» abort a draft that is still being written. */
export async function generateContent(body: GenerateRequest, signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<GenerateData>>(API_URLS.GENERATE.CONTENT, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
    signal,
  });
  return response.data;
}
