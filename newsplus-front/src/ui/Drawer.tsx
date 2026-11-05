import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import type { ScrimOverlayProps } from "./overlayTypes";
import { Scrim } from "./Scrim";
import { useMergedRef, useOverlay } from "./useOverlay";

export type DrawerProps = Omit<ComponentPropsWithoutRef<"section">, "role"> & ScrimOverlayProps;

/**
 * Desktop side drawer (DeskArchive): `.scrim` + `section.drawer[role=dialog][aria-modal=true]`, docked to the
 * inline end. Width and inner layout come from the board via `style` (`width: 500px; display: flex; flex-direction: column`).
 * Render it inside the positioned screen it covers.
 */
export const Drawer = forwardRef<HTMLElement, DrawerProps>(function Drawer(
  { open, onClose, initialFocusRef, returnFocusRef, scrimLabel, className, children, ...rest },
  ref,
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const setRef = useMergedRef(ref, containerRef);
  useOverlay({ open, onClose, containerRef, initialFocusRef, returnFocusRef, modal: true });

  if (!open) return null;
  return (
    <>
      <Scrim onClick={onClose} label={scrimLabel} />
      <section ref={setRef} className={cx("drawer", className)} role="dialog" aria-modal="true" tabIndex={-1} {...rest}>
        {children}
      </section>
    </>
  );
});
