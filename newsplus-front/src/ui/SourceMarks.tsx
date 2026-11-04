import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cx } from "./cx";

/** One source mark, named like the reference data: `ch` = letter, `bg` = the source colour. */
export type SourceMarkData = {
  ch: string;
  bg: string;
  /** React key; defaults to `ch + bg`. */
  id?: string;
};

export type SourceMarkProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & Pick<SourceMarkData, "ch" | "bg">;

/** Single `span.mark` (letter on the source colour) — used alone in source lists (MobFilters, Main-filters). */
export const SourceMark = forwardRef<HTMLSpanElement, SourceMarkProps>(function SourceMark(
  { ch, bg, className, style, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("mark", className)} style={{ background: bg, ...style }} {...rest}>
      {ch}
    </span>
  );
});

export type SourceMarksProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  marks: ReadonlyArray<SourceMarkData>;
  /** Extra inline style for every mark (boards resize marks inline, e.g. `width: 26px; height: 26px`). */
  markStyle?: CSSProperties;
};

/** `span.marks` — overlapping stack of `span.mark`. Slice the list to the board's maximum before passing it. */
export const SourceMarks = forwardRef<HTMLSpanElement, SourceMarksProps>(function SourceMarks(
  { marks, markStyle, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("marks", className)} {...rest}>
      {marks.map((mark) => (
        <SourceMark key={mark.id ?? mark.ch + mark.bg} ch={mark.ch} bg={mark.bg} style={markStyle} />
      ))}
    </span>
  );
});
