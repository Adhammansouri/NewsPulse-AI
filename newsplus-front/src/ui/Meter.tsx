import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cx } from "./cx";

export type MeterProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Fill, 0–100 (percent). */
  value: number;
  /** Inline style on the fill span (boards recolour it: `background: var(--navy)` / `var(--ink-3)`). */
  barStyle?: CSSProperties;
};

/** `div.meter > span` — the fill width is the value in percent. */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { value, barStyle, className, ...rest },
  ref,
) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div ref={ref} className={cx("meter", className)} {...rest}>
      <span style={{ width: `${pct}%`, ...barStyle }} />
    </div>
  );
});
