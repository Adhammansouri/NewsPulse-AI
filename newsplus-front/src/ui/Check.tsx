import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export type CheckProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  checked: boolean;
};

/**
 * `span.check` (+ `is-on` with the check icon). Visual only: the row that contains it carries the state
 * (e.g. MobFilters `button.m-item[aria-pressed]`).
 */
export const Check = forwardRef<HTMLSpanElement, CheckProps>(function Check({ checked, className, ...rest }, ref) {
  return (
    <span ref={ref} className={cx("check", checked && "is-on", className)} {...rest}>
      {checked && <Icon name="check" size="sm" />}
    </span>
  );
});
