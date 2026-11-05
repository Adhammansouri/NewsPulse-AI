import type { ApiSuccessResponse, PresenceData, PresenceHeartbeatData, PresenceHeartbeatRequest } from "@newsplus/shared";
import { apiRequest } from "./httpConfig";

/** S15 live presence (in-memory on the API, entries expire 45s after their last heartbeat). */
const PRESENCE_URLS = {
  LIST: "/presence",
  HEARTBEAT: "/presence/heartbeat",
} as const;

export async function getPresence(signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<PresenceData>>(PRESENCE_URLS.LIST, { auth: true, signal });
  return response.data;
}

export async function sendPresenceHeartbeat(body: PresenceHeartbeatRequest) {
  const response = await apiRequest<ApiSuccessResponse<PresenceHeartbeatData>>(PRESENCE_URLS.HEARTBEAT, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
  return response.data;
}
