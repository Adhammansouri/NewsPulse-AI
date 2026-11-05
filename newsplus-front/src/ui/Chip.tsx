import { forwardRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { cx } from "./cx";

export type ChipClassOptions = {
  /** `chip--sm` */
  size?: "sm";
  /** `chip--ai`: gradient outline, for AI quick actions. */
  ai?: boolean;
  /** `chip--soft`: sunken surface (static source chips). */
  soft?: boolean;
};

/** `chip chip--sm chip--ai chip--soft` — for router links styled as chips. */
export function chipClassName({ size, ai, soft }: ChipClassOptions = {}, className?: string): string {
  return cx("chip", size && `chip--${size}`, ai && "chip--ai", soft && "chip--soft", className);
}

type ChipOwnProps = ChipClassOptions & {
  /** Toggle state → `aria-pressed`. Omit for action chips (quick revise) and static chips. */
  pressed?: boolean;
  /** Count rendered as `<span class="n num">` after the label. */
  count?: ReactNode;
};

export type ChipProps =
  | (ChipOwnProps & { as?: "button" } & Omit<ComponentPropsWithoutRef<"button">, keyof ChipOwnProps>)
  | (ChipOwnProps & { as: "span" } & Omit<ComponentPropsWithoutRef<"span">, keyof ChipOwnProps>)
  | (ChipOwnProps & { as: "a" } & Omit<ComponentPropsWithoutRef<"a">, keyof ChipOwnProps>);

/**
 * `.chip`: `button` (default, `type="button"`), static `span`, or `a`.
 * Toggle chips pass `pressed`; the count sits in `span.n.num`.
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, ref) {
  const { size, ai, soft, pressed, count, className, children } = props;
  const classes = chipClassName({ size, ai, soft }, className);
  const content = (
    <>
      {children}
      {count != null && <span className="n num">{count}</span>}
    </>
  );

  if (props.as === "span") {
    const { as: _as, size: _s, ai: _a, soft: _so, pressed: _p, count: _c, className: _cn, children: _ch, ...rest } = props;
    return (
      <span ref={ref as Ref<HTMLSpanElement>} className={classes} aria-pressed={pressed} {...rest}>
        {content}
      </span>
    );
  }
  if (props.as === "a") {
    const { as: _as, size: _s, ai: _a, soft: _so, pressed: _p, count: _c, className: _cn, children: _ch, ...rest } = props;
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  const { as: _as, size: _s, ai: _a, soft: _so, pressed: _p, count: _c, className: _cn, children: _ch, type, ...rest } = props;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type ?? "button"}
      className={classes}
      aria-pressed={pressed}
      {...rest}
    >
      {content}
    </button>
  );
});
