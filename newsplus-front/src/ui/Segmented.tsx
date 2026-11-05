import { forwardRef, type ComponentPropsWithoutRef, type ReactElement, type ReactNode, type Ref } from "react";
import { cx } from "./cx";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Shown but not selectable (`aria-disabled`, e.g. the UI-language control outside login in S02). */
  disabled?: boolean;
};

export type SegmentedProps<T extends string> = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange?: (value: T) => void;
  /** `seg--block`: equal-width segments filling the row. */
  block?: boolean;
};

function SegmentedInner<T extends string>(
  { options, value, onChange, block = false, className, ...rest }: SegmentedProps<T>,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <div ref={ref} className={cx("seg", block && "seg--block", className)} {...rest}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-disabled={option.disabled || undefined}
          onClick={() => {
            if (!option.disabled && option.value !== value) onChange?.(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * `div.seg` of `button[aria-pressed]` (+ `seg--block`). Pass `role="group"` + `aria-label`
 * where the board labels the group (e.g. Main: `role="group" aria-label="الوقت"`).
 */
export const Segmented = forwardRef(SegmentedInner) as <T extends string>(
  props: SegmentedProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
