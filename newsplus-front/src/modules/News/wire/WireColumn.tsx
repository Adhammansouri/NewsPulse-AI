// Desktop wire column (Main): header, the list with its designed states and the «عناوين جديدة» pill, and the
// filters popover. The selection lives in NewsPage; the column only reports picks.
import { useEffect, useRef, useState } from "react";
import type { NewsFeedItem } from "@newsplus/shared";
import { useHotkeyActions } from "@/hooks/hotkeyActions";
import { TIME_FILTERS } from "../newsFormat";
import { COPY } from "./copy";
import { FilterPopover } from "./FilterPopover";
import { NewItemsPill } from "./NewItemsPill";
import type { Wire } from "./useWire";
import { WireHeader } from "./WireHeader";
import { WireRow } from "./WireRow";
import { WireEmpty, WireError, WireSkeleton } from "./WireStates";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function WireColumn({
  wire,
  selectedId,
  onSelect,
  onBriefing,
}: {
  wire: Wire;
  selectedId: string | null;
  onSelect: (item: NewsFeedItem) => void;
  onBriefing: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filterRef = useRef<HTMLButtonElement | null>(null);

  function focusSearch() {
    setFilterOpen(false);
    searchRef.current?.focus();
  }

  // «/» (the search field's kbd hint) jumps to the search unless the user is typing somewhere. It runs before the
  // global shortcuts (S11, on the window), which leave a press handled here alone.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      focusSearch();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // S11 shortcuts: `/` arriving from another page (or on the Arabic layout), J / K, ↵ and 1–5.
  const revealRef = useRef(false);
  function step(by: 1 | -1) {
    const { rows } = wire;
    if (rows.length === 0) return;
    const index = rows.findIndex((row) => row.id === selectedId);
    const next = index === -1 ? rows[0] : rows[Math.min(rows.length - 1, Math.max(0, index + by))];
    if (next.id === selectedId) return;
    revealRef.current = true;
    onSelect(next.item);
  }
  useHotkeyActions({
    search: focusSearch,
    next: () => step(1),
    prev: () => step(-1),
    open: () => {
      const row = wire.rows.find((entry) => entry.id === selectedId);
      if (row) onSelect(row.item);
    },
    time: (index) => {
      const time = TIME_FILTERS[index - 1]?.id;
      if (time) wire.setFilters({ ...wire.filters, time });
    },
  });
  // J / K: the picked headline scrolls into view and takes the focus (↵ on it opens it, as a click does).
  useEffect(() => {
    if (!revealRef.current) return;
    revealRef.current = false;
    const row = wire.listRef.current?.querySelector<HTMLElement>('.wire-row[aria-pressed="true"]');
    row?.scrollIntoView({ block: "nearest" });
    row?.focus({ preventScroll: true });
  }, [selectedId, wire.listRef]);

  const { empty } = wire;

  return (
    <section
      aria-label={COPY.wireLabel}
      style={{
        position: "relative",
        width: "clamp(340px, 30vw, 420px)",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderInlineStart: "1px solid var(--line)",
      }}
    >
      <WireHeader
        wire={wire}
        searchRef={searchRef}
        filterRef={filterRef}
        filterOpen={filterOpen}
        onToggleFilter={() => setFilterOpen((open) => !open)}
        onBriefing={onBriefing}
      />
      <div
        ref={(node) => {
          wire.listRef.current = node;
        }}
        style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--line)" }}
      >
        {wire.loading && <WireSkeleton mobile={false} />}
        {wire.failed && <WireError mobile={false} savedClock={wire.savedClock} onRetry={() => void wire.refresh()} />}
        {empty && (
          <WireEmpty
            mobile={false}
            empty={empty}
            onWiden={() => empty.widen && wire.setFilters({ ...wire.filters, time: empty.widen.time })}
            onClear={wire.clearAll}
          />
        )}
        <NewItemsPill count={wire.newCount} onReveal={wire.revealNew} />
        {wire.rows.map((row) => (
          <WireRow key={row.id} row={row} selected={row.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      <FilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorRef={filterRef}
        filters={wire.filters}
        setFilters={wire.setFilters}
        sources={wire.sources}
      />
    </section>
  );
}
