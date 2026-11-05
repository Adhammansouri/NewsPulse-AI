import { useEffect, useSyncExternalStore } from "react";

/**
 * Screens can hide the mobile tab bar for a focused state (MobGenerate writing / done: the board's
 * `showTabs` is false there). Each caller holds the bar hidden while it is mounted with `hidden` true.
 */
let holds = 0;
const listeners = new Set<() => void>();

function setHolds(next: number) {
  holds = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const isHidden = () => holds > 0;

/** Hides the tab bar while `hidden` is true (and the caller is mounted). */
export function useHideTabBar(hidden: boolean) {
  useEffect(() => {
    if (!hidden) return;
    setHolds(holds + 1);
    return () => setHolds(holds - 1);
  }, [hidden]);
}

/** MainLayout: whether a screen currently hides the tab bar. */
export function useTabBarHidden() {
  return useSyncExternalStore(subscribe, isHidden, isHidden);
}
