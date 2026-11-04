import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

export type SurfaceTag = "div" | "section" | "article" | "aside";

export type PanelProps = ComponentPropsWithoutRef<"div"> & {
  /** Element to render (boards use div, section, article, aside). */
  as?: SurfaceTag;
  /** `panel--flat`: no shadow. */
  flat?: boolean;
  /** Renders `div.ai-strip` (3px AI gradient bar) as the first child (NewPublish aside). */
  strip?: boolean;
};

/** `.panel` (+ `panel--flat`): the surface card with border and `--shadow-1`. */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { as: Tag = "div", flat = false, strip = false, className, children, ...rest },
  ref,
) {
  return (
    <Tag ref={ref as never} className={cx("panel", flat && "panel--flat", className)} {...rest}>
      {strip && <div className="ai-strip" />}
      {children}
    </Tag>
  );
});
