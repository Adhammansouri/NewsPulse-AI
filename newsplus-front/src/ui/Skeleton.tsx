import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

type Length = number | string;

export type SkeletonProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Number → px, string as-is (`"28%"`). Omit to fill the row. */
  width?: Length;
  height?: Length;
  /** Overrides the 8px radius of `.sk` (wire marks use 7, cards 16). */
  radius?: Length;
};

/** `div.sk` — shimmering placeholder shaped like the content it stands in for. Sizes come in as inline style, as on the boards. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, radius, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("sk", className)}
      style={{ width, height, borderRadius: radius, ...style }}
      {...rest}
    />
  );
});
