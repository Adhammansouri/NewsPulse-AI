import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import type { SurfaceTag } from "./Panel";

export type AiPanelProps = ComponentPropsWithoutRef<"div"> & {
  /** Element to render (boards use div and section). */
  as?: SurfaceTag;
  /** `ai-glow`: rotating gradient ring while the editor is working. */
  glow?: boolean;
  /** Renders `div.ai-strip` (3px AI gradient bar) as the first child (MobTranslate output). */
  strip?: boolean;
};

/** `.ai-panel` (+ `ai-glow`): gradient-bordered surface for AI output and progress. */
export const AiPanel = forwardRef<HTMLElement, AiPanelProps>(function AiPanel(
  { as: Tag = "div", glow = false, strip = false, className, children, ...rest },
  ref,
) {
  return (
    <Tag ref={ref as never} className={cx("ai-panel", glow && "ai-glow", className)} {...rest}>
      {strip && <div className="ai-strip" />}
      {children}
    </Tag>
  );
});
