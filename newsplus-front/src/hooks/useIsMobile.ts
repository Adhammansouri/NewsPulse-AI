import { useSyncExternalStore } from "react";

/** Below 1024px the app renders the mobile (`Mob*`) design — GLOBAL-RULES §6. */
const MOBILE_QUERY = "(max-width: 1023.98px)";

let mediaQuery: MediaQueryList | null = null;

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  mediaQuery ??= window.matchMedia(MOBILE_QUERY);
  return mediaQuery;
}

function subscribe(onChange: () => void) {
  const mql = getMediaQuery();
  if (!mql) return () => {};
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return getMediaQuery()?.matches ?? false;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
