import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "./cx";
import { PulseLine } from "./PulseLine";

export type ButtonVariant = "ai" | "ink" | "quiet" | "ghost" | "danger";
export type ButtonSize = "sm" | "lg";

export type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

/** `btn btn--{variant} btn--{size} btn--block` — for links styled as buttons: `<Link className={buttonClassName({ variant: "ink" })}>`. */
export function buttonClassName({ variant, size, block }: ButtonClassOptions = {}, className?: string): string {
  return cx("btn", variant && `btn--${variant}`, size && `btn--${size}`, block && "btn--block", className);
}

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  ButtonClassOptions & {
    /**
     * Busy state: the small pulse line (DeskLogin `54x20`) before the label, and the button stops acting
     * (`aria-disabled` + `aria-busy`; clicks and implicit form submits are swallowed). It keeps full opacity
     * like the DeskLogin loading button, instead of the dimmed `:disabled` look.
     */
    loading?: boolean;
    /** Keyboard hint rendered after the label as `<span class="kbd">`. */
    kbd?: ReactNode;
  };

/** `button.btn` with the np4 variants. Defaults to `type="button"`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    block,
    loading = false,
    kbd,
    className,
    type = "button",
    onClick,
    "aria-disabled": ariaDisabled,
    children,
    ...rest
  },
  ref,
) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, block }, className)}
      aria-disabled={loading ? true : ariaDisabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading && <PulseLine preset="54x20" />}
      {children}
      {kbd != null && <span className="kbd">{kbd}</span>}
    </button>
  );
});
