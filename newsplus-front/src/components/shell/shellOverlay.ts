// S11: which shell overlay is open — the command palette (Ctrl/⌘ K) or the shortcuts sheet (`?`, the rail's
// keyboard button). One at a time; Hotkeys.tsx renders it.
import { useSyncExternalStore, type CSSProperties } from "react";

export type ShellOverlay = "palette" | "shortcuts" | null;

/**
 * Their viewport layer: over the whole app, the rail included (the boards' scrim covers it), and above the
 * screens' own layers — the palette's z-index, which the PWA layer also uses.
 */
export const SHELL_LAYER_STYLE: CSSProperties = { position: "fixed", inset: 0, zIndex: 6 };

let current: ShellOverlay = null;
const listeners = new Set<() => void>();

function set(next: ShellOverlay) {
  if (current === next) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const openPalette = () => set("palette");
export const openShortcuts = () => set("shortcuts");
export const closeShellOverlay = () => set(null);

export function useShellOverlay(): ShellOverlay {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
