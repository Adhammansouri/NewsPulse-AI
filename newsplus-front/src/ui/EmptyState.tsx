import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";

export type EmptyStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** Content of `span.empty__art` — usually `<Icon size="xl">`. */
  art?: ReactNode;
  /** Extra class on the art (States board uses `ic-wrap--ai` for the AI empty state). */
  artClassName?: string;
  /** Inline style on the art, as boards tint it (`background: var(--ai-soft)`, warn/breaking soft, 96/104px). */
  artStyle?: CSSProperties;
  title?: ReactNode;
  /** Heading element: `h2` (default) or `h3`. */
  titleAs?: "h2" | "h3";
  /** Heading class: `t-title` (default) or `t-head` (compact empties, States board). */
  titleClassName?: string;
  /** Body copy, rendered as `p.t-small`. */
  description?: ReactNode;
  /** Inline style on the description (boards cap its width, e.g. `max-width: 300px`). */
  descriptionStyle?: CSSProperties;
  /** Children render after the description: the recovery action(s). */
  children?: ReactNode;
};

/** `div.empty`: `span.empty__art`, heading, `p.t-small`, then actions. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    art,
    artClassName,
    artStyle,
    title,
    titleAs: TitleTag = "h2",
    titleClassName = "t-title",
    description,
    descriptionStyle,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div ref={ref} className={cx("empty", className)} {...rest}>
      {art != null && (
        <span className={cx("empty__art", artClassName)} style={artStyle}>
          {art}
        </span>
      )}
      {title != null && <TitleTag className={titleClassName}>{title}</TitleTag>}
      {description != null && (
        <p className="t-small" style={descriptionStyle}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
});
