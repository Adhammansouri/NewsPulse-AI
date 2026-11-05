// S11 §1: the global keyboard shortcuts (desktop only). One keydown listener on the window, in the bubble phase,
// so it runs after the screens' own listeners (document / elements) and leaves alone any press one of them already
// handled (`defaultPrevented`): the studio footer's Ctrl/⌘ ↵, the generate screen's Ctrl/⌘ ↵, the overlays' Esc.
// It stands down while typing (except Esc, Ctrl/⌘ K, Ctrl/⌘ ↵), during IME composition, and while any overlay is
// open. The keymap itself is in hotkeys.ts; what each action does is the caller's `run`.
import { useEffect, useRef } from "react";
import { isOverlayOpen } from "@/ui/useOverlay";
import {
  allowedWhileTyping,
  isActivationTarget,
  isTypingTarget,
  readKey,
  repeats,
  resolveHotkey,
  type HotkeyAction,
  type SequenceState,
} from "./hotkeys";

/** Runs an action; false when it does not apply here (nothing registered), so the key keeps its default. */
export type HotkeyRunner = (action: HotkeyAction) => boolean;

export function useHotkeys({ enabled, run }: { enabled: boolean; run: HotkeyRunner }): void {
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    if (!enabled) return;
    let sequence: SequenceState = null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (isOverlayOpen()) {
        sequence = null;
        return;
      }
      const combo = readKey(event);
      if (!combo) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (isTypingTarget(target) && !allowedWhileTyping(combo)) return;

      const { action, state, consumed } = resolveHotkey(combo, sequence, Date.now());
      sequence = state;
      if (!action) {
        if (consumed) event.preventDefault();
        return;
      }
      if (event.repeat && !repeats(action)) return;
      // ↵ on a button, link or option is that element's own; the shortcut is for ↵ pressed on the page.
      if (action.type === "open" && isActivationTarget(target)) return;
      if (runRef.current(action)) event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
