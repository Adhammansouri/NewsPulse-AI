import { useEffect, useRef } from "react";
import { registerUnsentDraft, type UnsentDraftKey } from "@/services/unsentDrafts";

/**
 * Registers this screen's unsent work for «الجلسة انتهت» (S10): `read()` is called when the session expires and
 * returns what to keep (or null). The latest `read` is always used, so it can close over the current state.
 */
export function useUnsentDraft(key: UnsentDraftKey, read: () => unknown) {
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });
  useEffect(() => registerUnsentDraft(key, () => readRef.current()), [key]);
}
