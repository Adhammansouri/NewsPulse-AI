import type {
  ApiSuccessResponse,
  AuthMeData,
  AuthUser,
  ForgotPasswordRequest,
  LoginData,
  LoginRequest,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { unsubscribeFromPush } from "./pushService";
import { clearSession, saveSession } from "./sessionStore";
import { API_URLS } from "./urls";

export type { NewsplusSession } from "./sessionStore";
export { clearSession, getSession } from "./sessionStore";

export async function loginWithCredentials(
  identifier: string,
  password: string,
  persist = false,
): Promise<AuthUser> {
  const response = await apiRequest<ApiSuccessResponse<LoginData>>(API_URLS.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify({ identifier, password } satisfies LoginRequest),
  });

  saveSession({ token: response.data.token, user: response.data.user }, persist);
  return response.data.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<ApiSuccessResponse<{ accepted: boolean }>>(API_URLS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ email } satisfies ForgotPasswordRequest),
  });
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