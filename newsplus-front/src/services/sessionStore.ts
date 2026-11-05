import type { AuthUser } from "@newsplus/shared";

const SESSION_KEY = "newsplus-session";
const AUTH_EVENT = "newsplus-auth-changed";

export type NewsplusSession = {
  token: string;
  user: AuthUser;
  persisted: boolean;
};

let memorySession: NewsplusSession | null = null;
/**
 * S10: the token a 401 rejected. The session stays until the user presses «سجّل الدخول» in the «الجلسة انتهت»
 * dialog, so the screen (and its unsent text) is still there behind it. A new session (this tab or another)
 * has another token, which ends the expired state by itself.
 */
let expiredToken: string | null = null;

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
  if (memorySession) return memorySession;
  try {
    const local = parseSession(localStorage.getItem(SESSION_KEY));
    if (local) return local;
  } catch {
    /* Try tab storage independently when persistent storage is blocked. */
  }
  try {
    return parseSession(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.token ?? null;
}

/** A 401 rejected `token` (still the current one): show «الجلسة انتهت» instead of dropping the screen. */
export function expireSession(token: string) {
  if (expiredToken === token) return;
  expiredToken = token;
  notify();
}

/** The current session's token was rejected (401) and the user hasn't signed in again yet. */
export function isSessionExpired(): boolean {
  if (expiredToken === null) return false;
  return getSession()?.token === expiredToken;
}

export function saveSession(session: Omit<NewsplusSession, "persisted">, persist: boolean) {
  expiredToken = null;
  memorySession = { ...session, persisted: persist };
  try {
    storageFor(!persist).removeItem(SESSION_KEY);
  } catch {
    /* A blocked storage API must not prevent using the other one. */
  }
  try {
    storageFor(persist).setItem(SESSION_KEY, JSON.stringify(memorySession));
  } catch {
    memorySession.persisted = false;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(memorySession));
    } catch {
      /* Keep the session in memory when all browser storage is blocked. */
    }
  }
  notify();
}

export function clearSession() {
  expiredToken = null;
  memorySession = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
  notify();
}

export function subscribeToSession(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SESSION_KEY) return;
    memorySession = null;
    listener();
  };
  window.addEventListener(AUTH_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
