import type { AuthUser } from "@newsplus/shared";

const SESSION_KEY = "newsplus-session";
const AUTH_EVENT = "newsplus-auth-changed";

export type NewsplusSession = {
  token: string;
  user: AuthUser;
  persisted: boolean;
};

let memorySession: NewsplusSession | null = null;

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

export function saveSession(session: Omit<NewsplusSession, "persisted">, persist: boolean) {
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
