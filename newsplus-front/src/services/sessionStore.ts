import type { AuthUser } from "@newsplus/shared";

const SESSION_KEY = "newsplus-session";
const AUTH_EVENT = "newsplus-auth-changed";

export type NewsplusSession = {
  token: string;
  user: AuthUser;
  persisted: boolean;
};

function storageFor(persisted: boolean) {
  return persisted ? localStorage : sessionStorage;
}

function parseSession(raw: string | null): NewsplusSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<NewsplusSession>;
    if (!parsed.token || !parsed.user?.id || !parsed.user.identifier) return null;
    return {
      token: parsed.token,
      user: parsed.user,
      persisted: Boolean(parsed.persisted),
    };
  } catch {
    return null;
  }
}

function notify() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getSession(): NewsplusSession | null {
  try {
    return parseSession(localStorage.getItem(SESSION_KEY)) ?? parseSession(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.token ?? null;
}

export function saveSession(session: Omit<NewsplusSession, "persisted">, persist: boolean) {
  const payload = JSON.stringify({ ...session, persisted: persist });
  try {
    storageFor(persist).setItem(SESSION_KEY, payload);
    storageFor(!persist).removeItem(SESSION_KEY);
  } catch {
    sessionStorage.setItem(SESSION_KEY, payload);
  }
  notify();
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
  notify();
}

export function subscribeToSession(listener: () => void) {
  window.addEventListener(AUTH_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(AUTH_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}