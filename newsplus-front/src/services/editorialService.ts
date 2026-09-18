import type {
  ApiSuccessResponse,
  EditorialConversationDetail,
  EditorialConversationListData,
  EditorialMemoryListData,
  EditorialMemoryStatus,
  EditorialMemoryUpdateRequest,
  EditorialReviseData,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

export async function listEditorialConversations(q?: string) {
  const params: Record<string, string> = {};
  if (q?.trim()) params.q = q.trim();
  const response = await apiRequest<ApiSuccessResponse<EditorialConversationListData>>(
    API_URLS.EDITORIAL.CONVERSATIONS,
    { auth: true, params },
  );
  return response.data;
}

export async function getEditorialConversation(id: string) {
  const response = await apiRequest<ApiSuccessResponse<EditorialConversationDetail>>(
    API_URLS.EDITORIAL.CONVERSATION(id),
    { auth: true },
  );
  return response.data;
}

export async function reviseEditorialConversation(id: string, instruction: string) {
  const response = await apiRequest<ApiSuccessResponse<EditorialReviseData>>(API_URLS.EDITORIAL.REVISE(id), {
    method: "POST",
    auth: true,
    body: JSON.stringify({ instruction }),
  });
  return response.data;
}

export async function restoreEditorialVersion(id: string, versionId: string) {
  const response = await apiRequest<ApiSuccessResponse<EditorialReviseData>>(API_URLS.EDITORIAL.RESTORE(id), {
    method: "POST",
    auth: true,
    body: JSON.stringify({ versionId }),
  });
  return response.data;
}

export async function listEditorialMemory(status?: EditorialMemoryStatus) {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const response = await apiRequest<ApiSuccessResponse<EditorialMemoryListData>>(API_URLS.EDITORIAL.MEMORY, {
    auth: true,
    params,
  });
  return response.data;
}

export async function updateEditorialMemory(id: string, body: EditorialMemoryUpdateRequest) {
  const response = await apiRequest<ApiSuccessResponse<EditorialMemoryListData["rules"][number]>>(
    API_URLS.EDITORIAL.MEMORY_RULE(id),
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    },
  );
  return response.data;
}
