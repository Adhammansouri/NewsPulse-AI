// S10 §1 (401): before «الجلسة انتهت» sends the user to the login, every screen with unsent work hands its text
// to `saveUnsentDrafts()`, which keeps it in this tab's sessionStorage. After signing in, the login returns to the
// same screen (RequireAuth's `from`), which takes its draft back once and clears it.

const PREFIX = "newsplus-unsent:";

export type UnsentDraftKey = "editorial" | "generate";

/** Readers of the screens on screen now; each returns its unsent work, or null when there is none. */
const readers = new Map<UnsentDraftKey, () => unknown>();

/** A screen registers what it would lose; returns the unregister. */
export function registerUnsentDraft(key: UnsentDraftKey, read: () => unknown) {
  readers.set(key, read);
  return () => {
    if (readers.get(key) === read) readers.delete(key);
  };
}

/** Writes every registered screen's unsent work (or drops its stale entry when it has none). */
export function saveUnsentDrafts() {
  for (const [key, read] of readers) {
    let value: unknown = null;
    try {
      value = read();
    } catch {
      value = null;
    }
    try {
      if (value === null || value === undefined) sessionStorage.removeItem(PREFIX + key);
      else sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* Storage blocked: nothing to keep across the login. */
    }
  }
}

/** The saved draft for `key`, without clearing it (safe in a render or a StrictMode double call). */
export function readUnsentDraft<T>(key: UnsentDraftKey): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearUnsentDraft(key: UnsentDraftKey) {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* private mode */
  }
}

/** Reads and clears in one step: the screen restores it once. */
export function takeUnsentDraft<T>(key: UnsentDraftKey): T | null {
  const value = readUnsentDraft<T>(key);
  if (value !== null) clearUnsentDraft(key);
  return value;
}
