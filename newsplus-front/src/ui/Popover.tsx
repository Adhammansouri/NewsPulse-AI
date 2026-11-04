import { forwardRef, useRef, type ComponentPropsWithoutRef, type RefObject } from "react";
import { cx } from "./cx";
import type { ScrimOverlayProps } from "./overlayTypes";
import { Scrim } from "./Scrim";
import { useMergedRef, useOverlay } from "./useOverlay";

export type PopoverProps = Omit<ComponentPropsWithoutRef<"div">, "role"> &
  ScrimOverlayProps & {
    /**
     * The trigger button. Pressing it does not count as an outside press (so it can toggle), and focus
     * returns to it on close. Give the trigger `aria-expanded={open}` as the boards do.
     */
    anchorRef?: RefObject<HTMLElement | null>;
    /**
     * `false` (default, Main-filters / DeskGenerate-drafts): no scrim, no `aria-modal`, closes on Esc or
     * a press outside the popover and its anchor. `true` (NewShortcuts): scrim + `aria-modal="true"`.
     * Tab stays inside the popover in both modes.
     */
    modal?: boolean;
  };

/**
 * `div.popover[role=dialog]` — absolutely positioned card (`z-index: 4`).
 *
 * Anchoring follows the boards: render it inside the positioned container that holds the trigger
 * (the wire column / form has `position: relative`) and place it with the board's inline `style`, e.g.
 * Main-filters `{ top: 132, insetInline: 16 }`, DeskGenerate-drafts `{ top: 78, insetInline: 20 }`.
 * Label it with `aria-label` («تصفية», «مسوداتي») or `aria-labelledby`.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    open,
    onClose,
    initialFocusRef,
    returnFocusRef,
    scrimLabel,
    anchorRef,
    modal = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMergedRef(ref, containerRef);
  useOverlay({
    open,
    onClose,
    containerRef,
    initialFocusRef,
    returnFocusRef: returnFocusRef ?? anchorRef,
    modal,
    anchorRef,
  });

  if (!open) return null;
  return (
    <>
      {modal && <Scrim onClick={onClose} label={scrimLabel} />}
      <div
        ref={setRef}
        className={cx("popover", className)}
        role="dialog"
        aria-modal={modal ? true : undefined}
        tabIndex={-1}
        {...rest}
      >
        {children}
      </div>
    </>
  );
});
