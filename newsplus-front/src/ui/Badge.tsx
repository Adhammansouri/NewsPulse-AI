import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

export type BadgeVariant = "breaking" | "teal" | "warn" | "ok" | "ai" | "topic" | "count";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  /** `badge--breaking` (pulsing coral dot) · `--teal` · `--warn` · `--ok` · `--ai` · `--topic` · `--count` (red count pill). */
  variant: BadgeVariant;
};

/** `span.badge.badge--{variant}`. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ variant, className, ...rest }, ref) {
  return <span ref={ref} className={cx("badge", `badge--${variant}`, className)} {...rest} />;
});
