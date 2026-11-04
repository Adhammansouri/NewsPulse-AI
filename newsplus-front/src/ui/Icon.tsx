import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cx } from "./cx";
import { ICON_PATHS, ICON_VIEWBOX, type IconName, type IconSize } from "./icons";

export type { IconName, IconSize } from "./icons";

export type IconProps = Omit<ComponentPropsWithoutRef<"svg">, "children"> & {
  name: IconName;
  /** sm 16 · md 20 (default, plain `ic`) · lg 24 · xl 32 — the classes `ic--sm|lg|xl` from np4.css. */
  size?: IconSize;
  /** AI icon: stroke painted with the hidden `#np-ai-grad` gradient (rendered once by `AiGradientDefs`). */
  ai?: boolean;
};

/** `<svg class="ic ic--{size}" viewBox="0 0 24 24" aria-hidden="true"><path d/></svg>` — icons.json only. */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = "md", ai = false, className, style, ...rest },
  ref,
) {
  let iconStyle: CSSProperties | undefined = style;
  if (name === "more") iconStyle = { strokeWidth: 3, ...iconStyle };
  if (ai) iconStyle = { stroke: "url(#np-ai-grad)", ...iconStyle };

  return (
    <svg
      ref={ref}
      className={cx("ic", size !== "md" && `ic--${size}`, className)}
      viewBox={ICON_VIEWBOX}
      aria-hidden="true"
      style={iconStyle}
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
});
