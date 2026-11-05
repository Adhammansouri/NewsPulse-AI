import {
  EDITORIAL_PUBLISH_PLATFORMS,
  HOOK_STYLES,
  type ApiSuccessResponse,
  type EditorialPublishPlatform,
  type HookStyle,
  type HookStylesData,
  type HookStylesRequest,
  type UserPreferences,
  type UserPreferencesUpdateRequest,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

function isPlatform(value: unknown): value is EditorialPublishPlatform {
  return typeof value === "string" && (EDITORIAL_PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

function isHookStyle(value: unknown): value is HookStyle {
  return typeof value === "string" && (HOOK_STYLES as readonly string[]).includes(value);
}

/** The API's answer, read defensively: the onboarding gate and the wire / publish defaults depend on it. */
export function readPreferences(raw: unknown): UserPreferences {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof UserPreferences, unknown>>;
  const platforms = Array.isArray(value.platforms) ? value.platforms.filter(isPlatform) : [];
  const sources = Array.isArray(value.sources) ? value.sources.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  return {
    platforms,
    sources,
    ...(isHookStyle(value.hookStyle) ? { hookStyle: value.hookStyle } : {}),
    ...(typeof value.onboardedAt === "string" && value.onboardedAt ? { onboardedAt: value.onboardedAt } : {}),
  };
}

/** S16 `GET /me/preferences`: the signed-in editor's onboarding choices. */
export async function getMyPreferences(signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<UserPreferences>>(API_URLS.ME.PREFERENCES, { auth: true, signal });
  return readPreferences(response.data);
}

/** S16 `PUT /me/preferences`: fields left out are kept; `onboarded: true` stamps `onboardedAt` once. */
export async function saveMyPreferences(body: UserPreferencesUpdateRequest) {
  const response = await apiRequest<ApiSuccessResponse<UserPreferences>>(API_URLS.ME.PREFERENCES, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
  return readPreferences(response.data);
}

/** S16 `POST /news/hook-styles`: the story's headline in the three hook styles (an AI route). */
export async function getHookStyles(body: HookStylesRequest, signal?: AbortSignal) {
  const response = await apiRequest<ApiSuccessResponse<HookStylesData>>(API_URLS.NEWS.HOOK_STYLES, {
    method: "POST",
    auth: true,
    ai: true,
    body: JSON.stringify(body),
    signal,
  });
  return response.data;
}
