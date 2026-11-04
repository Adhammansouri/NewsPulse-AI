// Mobile wire screen (MobWire): large `m-head` (title + live line, «موجز الساعة», search + filter button,
// topic chips — or the active filters as removable chips when nothing matches), then the list with its states,
// pull-to-refresh and swipe actions, and the filters sheet. Inline styles are the board's own.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { Chip } from "@/ui/Chip";
import { Icon } from "@/ui/Icon";
import { PulseLine } from "@/ui/PulseLine";
import { COPY } from "./copy";
import { FilterSheet } from "./FilterSheet";
import { NewItemsPill } from "./NewItemsPill";
import { SwipeRow } from "./SwipeRow";
import { usePullToRefresh } from "./usePullToRefresh";
import type { Wire } from "./useWire";
import { BriefingButton, FilterButton, TopicChips } from "./WireHeader";
import { WireEmpty, WireError, WireSkeleton } from "./WireStates";

export function MobWire({
  wire,
  onOpen,
  onBriefing,
  onWrite,
  onPin,
}: {
  wire: Wire;
  onOpen: (item: NewsFeedItem) => void;
  onBriefing: () => void;
  onWrite: (item: NewsFeedItem) => void;
  onPin: (item: NewsFeedItem) => void;
}) {
  const [params] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const refreshing = usePullToRefresh(scrollRef, wire.refresh);

  // A row left open closes on the next touch anywhere else.
  useEffect(() => {
    if (!swipedId) return;
    const onTouch = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`[data-swipe-row="${CSS.escape(swipedId)}"]`)) setSwipedId(null);
    };
    document.addEventListener("touchstart", onTouch, true);
    document.addEventListener("mousedown", onTouch, true);
    return () => {
      document.removeEventListener("touchstart", onTouch, true);
      document.removeEventListener("mousedown", onTouch, true);
    };
  }, [swipedId]);

  const hrefFor = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("item", id);
    return `?${next.toString()}`;
  };

  const { empty } = wire;

  return (
    <>
      <header className="m-head" style={{ gap: "12px", borderBottom: "1px solid var(--line)" }}>
        <div className="m-head__row">
          <span className="col grow">
            <span className="m-title">{COPY.title}</span>
            <span className="live">{wire.live}</span>
          </span>
          <BriefingButton onClick={onBriefing} />
        </div>
        <div className="row">
          <label className="field field--sunken grow">
            <Icon name="search" />
            <span className="sr">{COPY.searchLabelMob}</span>
            <input
              type="search"
              placeholder={COPY.searchPlaceholder}
              value={wire.query}
              onChange={(event) => wire.setQuery(event.target.value)}
            />
          </label>
          <FilterButton count={wire.activeCount} label={COPY.filter} onClick={() => setSheetOpen(true)} />
        </div>
        {empty ? (
          empty.chips.length > 0 && (
            <div className="row" style={{ gap: "6px" }}>
              {empty.chips.map((chip) => (
                <Chip key={chip.key} size="sm" pressed onClick={chip.clear}>
                  {chip.label}
                  <Icon name="close" size="sm" />
                </Chip>
              ))}
            </div>
          )
        ) : (
          <div className="scroll-x" style={{ marginInline: "-20px", paddingInline: "20px" }}>
            <TopicChips topics={wire.topics} onPick={(topic) => wire.setFilters({ ...wire.filters, topic })} />
          </div>
        )}
      </header>

      <main
        ref={(node) => {
          scrollRef.current = node;
          wire.listRef.current = node;
        }}
        className="m-scroll"
        style={{ background: "var(--surface)" }}
      >
        {refreshing && (
          <div className="ptr fade-in" role="status">
            <PulseLine preset="120x28" />
            {COPY.pulling}
          </div>
        )}
        {wire.loading && <WireSkeleton mobile />}
        {wire.failed && <WireError mobile savedClock={wire.savedClock} onRetry={() => void wire.refresh()} />}
        {empty && (
          <WireEmpty
            mobile
            empty={empty}
            onWiden={() => empty.widen && wire.setFilters({ ...wire.filters, time: empty.widen.time })}
            onClear={wire.clearAll}
          />
        )}
        <NewItemsPill count={wire.newCount} onReveal={wire.revealNew} />
        {wire.rows.length > 0 && (
          <div style={{ opacity: wire.failed ? ".6" : "1" }}>
            {wire.rows.map((row) => (
              <SwipeRow
                key={row.id}
                row={row}
                href={hrefFor(row.id)}
                open={swipedId === row.id}
                onOpenChange={(open) => setSwipedId(open ? row.id : (current) => (current === row.id ? null : current))}
                onTap={onOpen}
                onWrite={onWrite}
                onPin={onPin}
              />
            ))}
          </div>
        )}
      </main>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={wire.filters}
        setFilters={wire.setFilters}
        sources={wire.sources}
        resultCount={wire.rows.length}
      />
    </>
  );
}
