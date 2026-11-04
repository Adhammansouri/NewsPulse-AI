// «انقل إلى…» (S15 §2): the keyboard-accessible card menu that moves a draft to another column. NewBoard does not
// draw it; it is built from the kit's popover with the DeskGenerate «مسوداتي» popover's padding and header, and
// ghost buttons for the columns.
import type { RefObject } from "react";
import type { EditorialWorkflowStatus } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { Popover } from "@/ui/Popover";
import { COLUMNS } from "../boardModel";

export const MOVE_MENU_LABEL = "انقل إلى…";

export type MoveMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  /** The card's column — not offered as a target. */
  current: EditorialWorkflowStatus;
  onClose: () => void;
  onMove: (to: EditorialWorkflowStatus) => void;
};

export function MoveMenu({ open, anchorRef, current, onClose, onMove }: MoveMenuProps) {
  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      aria-label={MOVE_MENU_LABEL}
      className="col"
      style={{ top: "100%", insetInlineEnd: 0, padding: "10px", gap: "2px" }}
    >
      <div className="row" style={{ justifyContent: "space-between", padding: "6px 8px 10px" }}>
        <b style={{ fontWeight: 600 }}>{MOVE_MENU_LABEL}</b>
      </div>
      {COLUMNS.filter((column) => column.status !== current).map((column) => (
        <Button key={column.status} variant="ghost" size="sm" onClick={() => onMove(column.status)}>
          {column.label}
        </Button>
      ))}
    </Popover>
  );
}
