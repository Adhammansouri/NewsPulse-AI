import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & {
  /** Accessible name (`aria-label`) — required, the button has no visible text. */
  label: string;
  /** `icon-btn--line`: bordered surface variant. */
  line?: boolean;
  /** Shorthand for a single `<Icon name>` child. Extra children (e.g. a `badge--count`) render after it. */
  icon?: IconName;
};

/** `button.icon-btn` (+ `icon-btn--line`). Defaults to `type="button"`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, line = false, icon, className, type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("icon-btn", line && "icon-btn--line", className)}
      aria-label={label}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
});
