import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop = two-pane layouts; below this the UI is single-pane with a tab bar. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
