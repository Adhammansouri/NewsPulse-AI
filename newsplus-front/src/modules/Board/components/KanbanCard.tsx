// NewBoard `kcard` (S15 §2): format badge, assignee `ava`, title, live line («سارة بتكتب الآن» + `typing`, card
// `is-live`), meta row. A drag source for the column move; keyboard users get «انقل إلى…» (MoveMenu), whose
// trigger shows in the meta row's empty end slot while focus is in the card from the keyboard (the board draws
// no trigger).
import { useEffect, useRef, useState, type DragEvent, type FocusEvent, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { EditorialConversationSummary, EditorialWorkflowStatus, TeamMemberRef } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { commentsLine, formatBadge, initialOf, metaLine, writingLine } from "../boardModel";
import { MOVE_MENU_LABEL, MoveMenu } from "./MoveMenu";

const TITLE_STYLE = { fontWeight: 600, fontSize: "14.5px", lineHeight: 1.6 } as const;
/** The 32px `icon-btn` of the boards (DeskGenerate «حذف المسودة»). */
const TRIGGER_STYLE = { width: "32px", height: "32px" } as const;

export type KanbanCardProps = {
  card: EditorialConversationSummary;
  /** The teammate writing this draft right now (presence), if any. */
  writer?: TeamMemberRef;
  now: Date;
  /** Focus the card's link once mounted (after a keyboard move put it in another column). */
  autoFocus: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, to: EditorialWorkflowStatus) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

export function KanbanCard({ card, writer, now, autoFocus, onOpen, onMove, onDragStart, onDragEnd }: KanbanCardProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const assignee = card.assignee;
  const comments = commentsLine(card);
  const showTrigger = keyboardFocus || menuOpen;

  useEffect(() => {
    if (autoFocus) linkRef.current?.focus();
  }, [autoFocus]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    // The title link, the menu trigger and the menu act on their own.
    if (event.target instanceof Element && event.target.closest("a, button, .popover")) return;
    onOpen(card.id);
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setKeyboardFocus(true);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) setKeyboardFocus(false);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.id);
    onDragStart(card.id);
  }

  const ava = assignee && (
    <span className="ava" style={{ background: assignee.color }} title={assignee.displayName}>
      {initialOf(assignee.displayName)}
    </span>
  );

  return (
    <div
      className={cx("kcard", writer && "is-live")}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      // The menu is anchored to the card while it is open.
      style={menuOpen ? { position: "relative" } : undefined}
    >
      <span className="row" style={{ justifyContent: "space-between" }}>
        <Badge variant="ai">{formatBadge(card.format)}</Badge>
        {ava}
      </span>
      <b style={TITLE_STYLE}>
        <Link ref={linkRef} to="/news" state={{ conversationId: card.id }} draggable={false} style={{ color: "inherit" }}>
          {card.title}
        </Link>
      </b>
      {writer && (
        <span className="row t-meta" style={{ gap: "6px", color: "var(--cyan)" }}>
          <span className="typing">
            <i />
            <i />
            <i />
          </span>
          {writingLine(writer.displayName)}
        </span>
      )}
      <span className="row t-meta" style={{ justifyContent: "space-between" }}>
        <span>{metaLine(card, now)}</span>
        {showTrigger ? (
          // After the title link in DOM order, so Tab from the link reaches it.
          <span className="row">
            {comments}
            <button
              ref={triggerRef}
              className="icon-btn"
              type="button"
              aria-label={MOVE_MENU_LABEL}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              style={TRIGGER_STYLE}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name="more" size="sm" />
            </button>
          </span>
        ) : (
          <span>{comments}</span>
        )}
      </span>
      <MoveMenu
        open={menuOpen}
        anchorRef={triggerRef}
        current={card.status}
        onClose={() => setMenuOpen(false)}
        onMove={(to) => {
          setMenuOpen(false);
          onMove(card.id, to);
        }}
      />
    </div>
  );
}
