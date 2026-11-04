import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";

export type RingProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** Fill, 0–100 → `--p`. */
  value: number;
  /** Fill colour → `--c` (defaults to `--teal-dot` in npx.css). */
  color?: string;
  /** Centre label (inner `span`), e.g. a character count. */
  children?: ReactNode;
};

/** `span.ring` (conic progress, `--p` / `--c`) with the centre `span`. */
export const Ring = forwardRef<HTMLSpanElement, RingProps>(function Ring(
  { value, color, className, style, children, ...rest },
  ref,
) {
  const vars = { "--p": value, ...(color ? { "--c": color } : null), ...style } as CSSProperties;
  return (
    <span ref={ref} className={cx("ring", className)} style={vars} {...rest}>
      <span>{children}</span>
    </span>
  );
});
