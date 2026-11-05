import type {
  ApiSuccessResponse,
  AuthMeData,
  AuthUser,
  LoginData,
  LoginRequest,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { unsubscribeFromPush } from "./pushService";
import { clearSession, saveSession } from "./sessionStore";
import { API_URLS } from "./urls";

export type { NewsplusSession } from "./sessionStore";
export { clearSession, getSession } from "./sessionStore";

/** Sign-in request budget. Past it the request is aborted and the login screen shows its network state (S03). */
export const LOGIN_TIMEOUT_MS = 15_000;

export async function loginWithCredentials(
  identifier: string,
  password: string,
  persist = false,
): Promise<AuthUser> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  try {
    const response = await apiRequest<ApiSuccessResponse<LoginData>>(API_URLS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify({ identifier, password } satisfies LoginRequest),
      signal: controller.signal,
    });

    saveSession({ token: response.data.token, user: response.data.user }, persist);
    return response.data.user;
  } finally {
    clearTimeout(timer);
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<ApiSuccessResponse<AuthMeData>>(API_URLS.AUTH.ME, { auth: true });
  return response.data.user;
}

export async function logout(): Promise<void> {
  try {
    await unsubscribeFromPush();
  } catch {
    /* still log out locally */
  }

  try {
    await apiRequest<ApiSuccessResponse<{ loggedOut: boolean }>>(API_URLS.AUTH.LOGOUT, {
      method: "POST",
      auth: true,
    });
  } catch {
    /* client session is still cleared */
  } finally {
    clearSession();
  }
}