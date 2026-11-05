// Wire row (S04 §3): `wire-row` on the desktop column (Main), `m-row` in the mobile list (MobWire).
import type { CSSProperties, MouseEventHandler } from "react";
import type { NewsFeedItem } from "@newsplus/shared";
import { cx } from "@/ui/cx";
import { SourceMarks } from "@/ui/SourceMarks";
import { COPY } from "./copy";
import type { WireRowModel } from "./rows";

function RowFoot({ row, className }: { row: WireRowModel; className: string }) {
  return (
    <span className={className}>
      {row.breaking && <span className="badge badge--breaking">{COPY.breaking}</span>}
      <span className="badge badge--topic">{row.topic}</span>
      {row.draft && <span className="badge badge--ai">{COPY.draftReady}</span>}
    </span>
  );
}

/** Main: `button.wire-row[aria-pressed]` — the selected story gets the gradient + AI bar from np4. */
export function WireRow({
  row,
  selected,
  onSelect,
}: {
  row: WireRowModel;
  selected: boolean;
  onSelect: (item: NewsFeedItem) => void;
}) {
  return (
    <button
      type="button"
      className={cx("wire-row", row.freshness, row.arrive && "arrive")}
      aria-pressed={selected}
      onClick={() => onSelect(row.item)}
    >
      <span className="tick" aria-hidden="true" />
      <span className="wire-row__meta">
        <SourceMarks marks={row.marks} />
        <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{row.source}</span>
        <span>{row.more}</span>
        <span className="grow" />
        <span className="num">{row.time}</span>
      </span>
      <span className="wire-row__title" dir={row.dir}>
        {row.title}
      </span>
      <RowFoot row={row} className="wire-row__foot" />
    </button>
  );
}

/** MobWire: `a.m-row` linking to the story (`?item=`); MobWire handles the tap and the swipe. */
export function MobRow({
  row,
  href,
  style,
  onClick,
}: {
  row: WireRowModel;
  href: string;
  /** Drag offset while the row is being swiped (MobWire-swipe). */
  style?: CSSProperties;
  onClick: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a href={href} className={cx("m-row", row.freshness, row.arrive && "arrive")} style={style} onClick={onClick}>
      <span className="tick" aria-hidden="true" />
      <span className="m-row__meta">
        <SourceMarks marks={row.marks} />
        <b style={{ fontWeight: 600, color: "var(--ink-2)" }}>{row.more ? `${row.source} ${row.more}` : row.source}</b>
        <span className="grow" />
        <span className="num">{row.timeShort}</span>
      </span>
      <span className="m-row__title" dir={row.dir}>
        {row.title}
      </span>
      <RowFoot row={row} className="m-row__foot" />
    </a>
  );
}
