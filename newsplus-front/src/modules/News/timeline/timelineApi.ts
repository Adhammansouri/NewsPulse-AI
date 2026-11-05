// S14 `GET /news/items/:id/timeline`. `analyze: false` (`?analyze=0`) never makes the server call the model: the
// story tab's counts. The full read can call it (a new snapshot) and may answer 429, which starts the shared AI
// cooldown like any other AI request (`ai: true`).
import type { ApiSuccessResponse, TimelineData } from "@newsplus/shared";
import { apiRequest } from "@/services/httpConfig";

export const timelineUrl = (itemId: string) => `/news/items/${encodeURIComponent(itemId)}/timeline`;

export async function getStoryTimeline(itemId: string, { analyze, signal }: { analyze: boolean; signal?: AbortSignal }) {
  const response = await apiRequest<ApiSuccessResponse<TimelineData>>(timelineUrl(itemId), {
    auth: true,
    ai: analyze,
    params: analyze ? undefined : { analyze: "0" },
    signal,
  });
  return response.data;
}
