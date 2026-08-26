import type { ApiSuccessResponse, GenerateData, GenerateRequest } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

export async function generateContent(body: GenerateRequest) {
  const response = await apiRequest<ApiSuccessResponse<GenerateData>>(API_URLS.GENERATE.CONTENT, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
  return response.data;
}
