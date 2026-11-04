import type { ApiSuccessResponse, TeamData } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";

const TEAM_URL = "/team";

/** S15 `GET /team`: every member with `{ id, displayName, color, role }` (colour deterministic per user). */
export async function getTeam(signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<TeamData>>(TEAM_URL, { auth: true, signal });
  return response.data;
}
