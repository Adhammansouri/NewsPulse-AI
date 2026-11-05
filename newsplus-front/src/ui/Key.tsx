import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

export type KeyProps = ComponentPropsWithoutRef<"span">;

/** `span.key` — one keyboard key (`Ctrl`, `K`, `/`, `?`). LTR is set by npx.css. */
export const Key = forwardRef<HTMLSpanElement, KeyProps>(function Key({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("key", className)} {...rest} />;
});
