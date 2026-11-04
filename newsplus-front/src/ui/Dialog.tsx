import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import type { ScrimOverlayProps } from "./overlayTypes";
import { Scrim } from "./Scrim";
import { useMergedRef, useOverlay } from "./useOverlay";

export type DialogProps = Omit<ComponentPropsWithoutRef<"div">, "role"> &
  ScrimOverlayProps & {
    /** `alertdialog` (default — every `m-dialog` on the boards is a confirmation) or `dialog`. */
    role?: "dialog" | "alertdialog";
  };

/**
 * Centered confirmation dialog: `.scrim` + `div.m-dialog[role=alertdialog][aria-modal=true]` (MobSystem session / logout).
 * Content (ic-wrap, `h2.t-title` with the id passed to `aria-labelledby`, `p.t-small`, actions) is passed as children.
 * Render it inside the positioned screen it covers.
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onClose, initialFocusRef, returnFocusRef, scrimLabel, role = "alertdialog", className, children, ...rest },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMergedRef(ref, containerRef);
  useOverlay({ open, onClose, containerRef, initialFocusRef, returnFocusRef, modal: true });

  if (!open) return null;
  return (
    <>
      <Scrim onClick={onClose} label={scrimLabel} />
      <div ref={setRef} className={cx("m-dialog", className)} role={role} aria-modal="true" tabIndex={-1} {...rest}>
        {children}
      </div>
    </>
  );
});
