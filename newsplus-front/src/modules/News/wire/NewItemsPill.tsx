import { countPhrase } from "@/utils/arabic";
import { NEW_HEADLINES } from "./copy";

/** Arrow of the Main board's pill (not in icons.json), drawn as the board does. */
const ARROW_UP = "M12 19V5M6 11l6-6 6 6";

/**
 * `wire-new` (S04 §4): polled headlines newer than the newest one on screen wait behind this pill —
 * «عنوانان جديدان». Clicking inserts them (`arrive`) and scrolls the list to the top; the selection stays.
 */
export function NewItemsPill({ count, onReveal }: { count: number; onReveal: () => void }) {
  if (count <= 0) return null;
  return (
    <button className="wire-new" type="button" onClick={onReveal}>
      <svg className="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true">
        <path d={ARROW_UP} />
      </svg>
      {countPhrase(count, NEW_HEADLINES)}
    </button>
  );
}
