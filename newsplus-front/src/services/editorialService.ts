import type {
  ApiSuccessResponse,
  EditorialConversationDetail,
  EditorialConversationListData,
  EditorialConversationListQuery,
  EditorialConversationSummary,
  EditorialConversationUpdateRequest,
  EditorialMemoryCreateRequest,
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
    ai: true,
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

/** S16 `POST /editorial/memory`: a rule the editor states (onboarding's hook style), saved as approved. */
export async function createEditorialMemory(body: EditorialMemoryCreateRequest) {
  const response = await apiRequest<ApiSuccessResponse<EditorialMemoryListData["rules"][number]>>(API_URLS.EDITORIAL.MEMORY, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
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

/** S15 board list: `?scope=team|mine&status=` (+ `q`). The response then carries per-status `counts`. */
export async function listEditorialConversationsBy(query: EditorialConversationListQuery, signal?: AbortSignal) {
  const params: Record<string, string> = {};
  if (query.q?.trim()) params.q = query.q.trim();
  if (query.scope) params.scope = query.scope;
  if (query.status) params.status = query.status;
  const response = await apiRequest<ApiSuccessResponse<EditorialConversationListData>>(
    API_URLS.EDITORIAL.CONVERSATIONS,
    { auth: true, params, signal },
  );
  return response.data;
}

/** S15 `PATCH /editorial/conversations/:id` — move a draft between columns, reassign it, set its platforms. */
export async function updateEditorialConversation(id: string, body: EditorialConversationUpdateRequest) {
  const response = await apiRequest<ApiSuccessResponse<EditorialConversationSummary>>(
    API_URLS.EDITORIAL.CONVERSATION(id),
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(body),
    },
  );
  return response.data;
}
