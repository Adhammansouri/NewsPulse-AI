import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import type { ScrimOverlayProps } from "./overlayTypes";
import { Scrim } from "./Scrim";
import { useMergedRef, useOverlay } from "./useOverlay";

export type SheetProps = Omit<ComponentPropsWithoutRef<"section">, "role"> &
  ScrimOverlayProps & {
    /** `dialog` (default) or `alertdialog` (MobSystem quota). Label it with `aria-labelledby` (its `h2` id) or `aria-label`. */
    role?: "dialog" | "alertdialog";
  };

/**
 * Mobile bottom sheet: `.scrim` + `section.sheet[role=dialog][aria-modal=true]` with the `.grabber` first.
 * Both are `position:absolute` — render it inside the screen it covers (the `.np.m` root is positioned).
 * Layout inside is free: boards add `col`, padding and `max-height` via `className` / `style`.
 */
export const Sheet = forwardRef<HTMLElement, SheetProps>(function Sheet(
  { open, onClose, initialFocusRef, returnFocusRef, scrimLabel, role = "dialog", className, children, ...rest },
  ref,
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const setRef = useMergedRef(ref, containerRef);
  useOverlay({ open, onClose, containerRef, initialFocusRef, returnFocusRef, modal: true });

  if (!open) return null;
  return (
    <>
      <Scrim onClick={onClose} label={scrimLabel} />
      <section ref={setRef} className={cx("sheet", className)} role={role} aria-modal="true" tabIndex={-1} {...rest}>
        <div className="grabber" aria-hidden="true" />
        {children}
      </section>
    </>
  );
});
