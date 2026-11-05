import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { cx } from "./cx";

export type SwitchProps = Omit<ComponentPropsWithoutRef<"button">, "role" | "aria-checked" | "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name (`aria-label`) when there is no visible label (`aria-labelledby` also works). */
  label?: string;
};

/** `button.switch[role=switch][aria-checked]` — the knob is drawn by np4.css. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, label, className, type = "button", onClick, ...rest },
  ref,
) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) onCheckedChange?.(!checked);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cx("switch", className)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={handleClick}
      {...rest}
    />
  );
});
