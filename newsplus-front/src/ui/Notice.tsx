import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "./cx";

export type NoticeVariant = "error" | "warn" | "info" | "ok";

export type NoticeProps = ComponentPropsWithoutRef<"div"> & {
  variant: NoticeVariant;
  /** Leading icon: an `<Icon>` (boards colour it inline) or an `ic-wrap` span. */
  icon?: ReactNode;
  /** Class of the single text `<span>` (boards use `grow`, `t-small` or `col grow` for title + text). */
  textClassName?: string;
  /** Trailing action, e.g. `<Button variant="quiet" size="sm">حاول تاني</Button>`. */
  action?: ReactNode;
};

/** `div.notice.notice--{variant}`: icon, then the text wrapped in exactly one `<span>`, then the action. */
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  { variant, icon, textClassName, action, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx("notice", `notice--${variant}`, className)} {...rest}>
      {icon}
      <span className={textClassName}>{children}</span>
      {action}
    </div>
  );
});
