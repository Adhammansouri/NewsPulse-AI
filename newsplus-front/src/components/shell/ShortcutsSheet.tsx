// S11 §3 · NewShortcuts: «اختصارات الكيبورد», a modal `popover` (880px) over the whole app — the header with
// «اقفل Esc», the four groups in a two-column grid, the tip line. Opened by `?` and the rail's keyboard button.
// Inline styles are the board's own.
import { useId, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { features } from "@/config/features";
import { Icon } from "@/ui/Icon";
import { Key } from "@/ui/Key";
import { Popover } from "@/ui/Popover";
import { SHEET_COPY, SHORTCUT_GROUPS, type ShortcutRow } from "./commandModel";
import { SHELL_LAYER_STYLE } from "./shellOverlay";

const SHEET_STYLE: CSSProperties = {
  top: "70px",
  insetInline: 0,
  marginInline: "auto",
  width: "min(880px,92%)",
  padding: "22px 26px",
  gap: "18px",
  // The sheet has no control, so the dialog itself holds the focus (useOverlay); it is not a control either, and
  // NewShortcuts draws no ring around it.
  outline: 0,
};
const ROW_STYLE: CSSProperties = { justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line)" };

function shown(row: ShortcutRow): boolean {
  return row.flag === undefined || features[row.flag];
}

/** The sheet's content (header, groups, tip). */
export function ShortcutsSheetBody({ titleId }: { titleId: string }) {
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row">
          <span className="ic-wrap">
            <Icon name="keyboard" />
          </span>
          <h2 id={titleId} className="t-title">
            {SHEET_COPY.title}
          </h2>
        </span>
        <span className="row t-meta" style={{ gap: "6px" }}>
          {SHEET_COPY.close} <Key>Esc</Key>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} className="col">
            <h3 className="t-label" style={{ marginBottom: "6px" }}>
              {group.title}
            </h3>
            {group.rows.filter(shown).map((row) => (
              <div key={row.label} className="row" style={ROW_STYLE}>
                <span className="t-small" style={{ color: "var(--ink)" }}>
                  {row.label}
                </span>
                <span className="row" dir="ltr" style={{ gap: "4px" }}>
                  {row.keys.map((key) => (
                    <Key key={key}>{key}</Key>
                  ))}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
      <p className="t-meta">{SHEET_COPY.tip}</p>
    </>
  );
}

/** Ctrl/⌘ ↵ while the sheet is up must not reach the screen behind it (the studio footer writes on it). */
function holdModEnter(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const root = document.querySelector<HTMLElement>("div.np");
  if (!root) return null;
  return createPortal(
    <div style={SHELL_LAYER_STYLE}>
      <Popover open modal onClose={onClose} aria-labelledby={titleId} className="col" style={SHEET_STYLE} onKeyDown={holdModEnter}>
        <ShortcutsSheetBody titleId={titleId} />
      </Popover>
    </div>,
    root,
  );
}
