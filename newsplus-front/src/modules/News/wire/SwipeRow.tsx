// MobWire-swipe (S04 §7): a wire row dragged sideways shows «اكتب منشور» and «للموجز» (96px each) behind it
// and snaps open at 192px (`.swipe .m-row` in npm2.css). The wrapper is always rendered so the row under the
// finger is never re-mounted mid-gesture; only its `swipe` class comes and goes.
import { useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from "react";
import type { NewsFeedItem } from "@newsplus/shared";
import { Icon } from "@/ui/Icon";
import { COPY } from "./copy";
import type { WireRowModel } from "./rows";
import { MobRow } from "./WireRow";

/** Both actions (`.swipe .m-row { transform: translateX(-192px) }`); past half of it the row snaps open. */
const OPEN_PX = 192;
const SNAP_PX = OPEN_PX / 2;
const SLOP_PX = 10;

type Drag = { x: number; y: number; base: number; axis: "x" | "y" | null };

export function SwipeRow({
  row,
  href,
  open,
  onOpenChange,
  onTap,
  onWrite,
  onPin,
}: {
  row: WireRowModel;
  href: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTap: (item: NewsFeedItem) => void;
  onWrite: (item: NewsFeedItem) => void;
  onPin: (item: NewsFeedItem) => void;
}) {
  const drag = useRef<Drag | null>(null);
  const offsetRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const [offset, setOffset] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setClosing(true);
  }

  const moveTo = (value: number | null) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    drag.current = { x: touch.clientX, y: touch.clientY, base: open ? -OPEN_PX : 0, axis: null };
    draggedRef.current = false;
  };
  const onTouchMove = (event: TouchEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.touches[0].clientX - d.x;
    const dy = event.touches[0].clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (d.axis !== "x") return;
    draggedRef.current = true;
    setClosing(false);
    moveTo(Math.min(0, Math.max(-OPEN_PX, d.base + dx)));
  };
  const onTouchEnd = () => {
    const d = drag.current;
    drag.current = null;
    const last = offsetRef.current;
    if (!d || d.axis !== "x" || last === null) return;
    moveTo(null);
    const snapOpen = last <= -SNAP_PX;
    if (snapOpen !== open) onOpenChange(snapOpen);
    else if (!snapOpen && last < 0) setClosing(true);
  };

  const onRowClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (open) onOpenChange(false);
    else onTap(row.item);
  };

  const swiping = open || closing || offset !== null;
  let rowStyle: CSSProperties | undefined;
  if (offset !== null) rowStyle = { transform: `translateX(${offset}px)`, transition: "none" };
  else if (closing) rowStyle = { transform: "translateX(0)" };

  return (
    <div
      className={swiping ? "swipe" : undefined}
      data-swipe-row={row.id}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onTransitionEnd={(event) => {
        if (closing && event.propertyName === "transform") setClosing(false);
      }}
    >
      {swiping && (
        <div className="swipe__actions">
          <button
            className="swipe__act"
            type="button"
            style={{ background: "var(--ai)", border: 0 }}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              onOpenChange(false);
              onWrite(row.item);
            }}
          >
            <Icon name="sparkle" />
            {COPY.swipeWrite}
          </button>
          <button
            className="swipe__act"
            type="button"
            style={{ background: "var(--navy)", border: 0 }}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              onOpenChange(false);
              onPin(row.item);
            }}
          >
            <Icon name="bolt" />
            {COPY.swipePin}
          </button>
        </div>
      )}
      <MobRow row={row} href={href} style={rowStyle} onClick={onRowClick} />
    </div>
  );
}
