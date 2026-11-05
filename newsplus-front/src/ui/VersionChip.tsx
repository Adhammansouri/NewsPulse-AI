import { forwardRef, type ComponentPropsWithoutRef, type Ref } from "react";
import { cx } from "./cx";

type VersionChipOwnProps = {
  /** Current version → `aria-current="true"` (navy fill). */
  current?: boolean;
};

export type VersionChipProps =
  | (VersionChipOwnProps & { as?: "span" } & ComponentPropsWithoutRef<"span">)
  | (VersionChipOwnProps & { as: "button" } & ComponentPropsWithoutRef<"button">);

/**
 * `.vchip` version chip (ن١ ن٢ …). Static `span` by default; `as="button"` for restorable versions
 * (Main-social: `aria-label="استعادة النسخة ١"`, current: `aria-label="النسخة ٣ الحالية"`).
 */
export const VersionChip = forwardRef<HTMLElement, VersionChipProps>(function VersionChip(props, ref) {
  if (props.as === "button") {
    const { as: _as, current, className, type, ...rest } = props;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? "button"}
        className={cx("vchip", className)}
        aria-current={current ? true : undefined}
        {...rest}
      />
    );
  }
  const { as: _as, current, className, ...rest } = props;
  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={cx("vchip", className)}
      aria-current={current ? true : undefined}
      {...rest}
    />
  );
});
