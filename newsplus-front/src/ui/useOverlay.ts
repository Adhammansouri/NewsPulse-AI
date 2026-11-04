import { useCallback, useEffect, useLayoutEffect, useRef, type Ref, type RefCallback, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
].join(",");

/** Focusable, tabbable and rendered elements inside `root`, in DOM order. */
export function getTabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.hasAttribute("inert") && el.getClientRects().length > 0,
  );
}

/** Open overlays, innermost last: only the top one reacts to Esc / Tab / outside focus. */
const stack: symbol[] = [];

export type OverlayOptions = {
  open: boolean;
  /** Called on Esc and on outside interaction. When omitted the overlay can only be closed by its own actions. */
  onClose?: () => void;
  containerRef: RefObject<HTMLElement | null>;
  /** Element to focus on open. Defaults to the first tabbable element, else the container. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Element to focus on close. Defaults to whatever had focus when the overlay opened (the trigger). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Modal: focus that lands outside (e.g. a click on the scrim) is pulled back in.
   * Non-modal (Popover): a pointer press outside the container and outside `anchorRef` closes it.
   */
  modal: boolean;
  /** Trigger of a non-modal popover: pressing it is not an "outside" press (the trigger toggles itself). */
  anchorRef?: RefObject<HTMLElement | null>;
};

/**
 * Dialog behaviour shared by Sheet, Drawer, Popover and Dialog:
 * moves focus in on open, traps Tab inside, closes on Esc, returns focus to the trigger on close.
 */
export function useOverlay({
  open,
  onClose,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  modal,
  anchorRef,
}: OverlayOptions): void {
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const id = Symbol("overlay");
    stack.push(id);
    const isTop = () => stack[stack.length - 1] === id;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus was last seen inside the overlay → hand it back to the trigger on close.
    // If the user moved it elsewhere (clicked another field), leave it there.
    let focusInside = true;

    const focusFirst = () => {
      const target = initialFocusRef?.current ?? getTabbables(container)[0] ?? container;
      target.focus({ preventScroll: true });
    };
    focusFirst();

    function onKeyDown(event: KeyboardEvent) {
      if (!isTop() || !container) return;
      if (event.key === "Escape") {
        if (onCloseRef.current) {
          event.preventDefault();
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const items = getTabbables(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && container.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event: FocusEvent) {
      if (!container) return;
      const inside = event.target instanceof Node && container.contains(event.target);
      if (isTop()) focusInside = inside;
      if (modal && isTop() && !inside) focusFirst();
    }

    function onPointerDown(event: PointerEvent) {
      if (modal || !isTop() || !container || !onCloseRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (container.contains(target) || anchorRef?.current?.contains(target)) return;
      onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown, true);
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);

      const active = document.activeElement;
      const focusLeftOverlay = active instanceof HTMLElement && active !== document.body && !container.contains(active);
      if (focusInside && !focusLeftOverlay) {
        const target = returnFocusRef?.current ?? opener;
        if (target && target.isConnected) target.focus({ preventScroll: true });
      }
    };
  }, [open, containerRef, initialFocusRef, returnFocusRef, modal, anchorRef]);
}

/** Points both the forwarded ref and the internal container ref at the same node. */
export function useMergedRef<T>(forwarded: Ref<T> | undefined, local: RefObject<T | null>): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      local.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded, local],
  );
}
