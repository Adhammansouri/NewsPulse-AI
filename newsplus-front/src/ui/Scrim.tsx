import type { MouseEventHandler } from "react";

export type ScrimProps = {
  onClick?: MouseEventHandler<HTMLElement>;
  /**
   * Accessible name when the scrim itself is a close control (MobFilters «إغلاق التصفية», DeskArchive «إغلاق الأرشيف»,
   * Motion «إغلاق»): renders `button.scrim`. Without it the scrim is a decorative `div[aria-hidden]`.
   */
  label?: string;
};

/** `.scrim`: the dimmed, blurred backdrop (absolute, fills the nearest positioned ancestor). */
export function Scrim({ onClick, label }: ScrimProps) {
  if (label) {
    return (
      <button className="scrim" type="button" aria-label={label} tabIndex={-1} onClick={onClick} style={{ border: 0 }} />
    );
  }
  return <div className="scrim" aria-hidden="true" onClick={onClick} />;
}
