// Desktop wire column (Main): header, the list with its designed states and the «عناوين جديدة» pill, and the
// filters popover. The selection lives in NewsPage; the column only reports picks.
import { useEffect, useRef, useState } from "react";
import type { NewsFeedItem } from "@newsplus/shared";
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

  // «/» (the search field's kbd hint) jumps to the search unless the user is typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      setFilterOpen(false);
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
