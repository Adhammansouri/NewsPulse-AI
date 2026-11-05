import type { ApiSuccessResponse, TranslateData, TranslateRequest } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

export async function translateContent(body: TranslateRequest) {
  const response = await apiRequest<ApiSuccessResponse<TranslateData>>(API_URLS.TRANSLATE.TEXT, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
  });
  return response.data;
}
