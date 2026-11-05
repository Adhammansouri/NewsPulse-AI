import { useSyncExternalStore } from "react";
import { isSessionExpired, subscribeToSession } from "@/services/sessionStore";

/** S10: a 401 rejected the current token → the «الجلسة انتهت» dialog. */
export function useSessionExpired(): boolean {
  return useSyncExternalStore(subscribeToSession, isSessionExpired, () => false);
}
