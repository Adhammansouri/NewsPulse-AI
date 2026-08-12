import type { ApiSuccessResponse, HealthData } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

export async function getHealth(): Promise<HealthData> {
  const response = await apiRequest<ApiSuccessResponse<HealthData>>(API_URLS.HEALTH);
  return response.data;
}
