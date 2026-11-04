// Desktop wire header (Main): title + live line, refresh, «موجز الساعة», search with the `/` hint, the
// filter button, time segments and topic chips. Inline styles are the board's own.
import { forwardRef, type RefObject } from "react";
import { Chip } from "@/ui/Chip";
import { Icon } from "@/ui/Icon";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { toArabicDigits } from "@/utils/arabic";
import { TIME_FILTERS, type TimeFilter, type TopicFilter } from "../newsFormat";
import { COPY, filterButtonLabel } from "./copy";
import type { Wire, WireTopic } from "./useWire";

export const TIME_OPTIONS: ReadonlyArray<SegmentedOption<TimeFilter>> = TIME_FILTERS.map((filter) => ({
  value: filter.id,
  label: filter.label,
}));

/** `chip chip--sm[aria-pressed]` with its count in `span.n.num`. */
export function TopicChips({ topics, onPick }: { topics: WireTopic[]; onPick: (id: TopicFilter) => void }) {
  return (
    <>
      {topics.map((topic) => (
        <Chip
          key={topic.id}
          size="sm"
          pressed={topic.pressed}
          count={topic.count === null ? undefined : toArabicDigits(topic.count)}
          onClick={() => onPick(topic.id)}
        >
          {topic.label}
        </Chip>
      ))}
    </>
  );
}

/** «موجز الساعة» — `btn--quiet btn--sm` with the bolt in `--cyan` (Main, MobWire). */
export function BriefingButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn btn--quiet btn--sm" type="button" onClick={onClick}>
      <Icon name="bolt" size="sm" style={{ color: "var(--cyan)" }} />
      {COPY.briefing}
    </button>
  );
}

/** Filter `icon-btn--line` (44px) with the `badge--count` of active popover / sheet filters. */
export const FilterButton = forwardRef<
  HTMLButtonElement,
  { count: number; label: string; expanded?: boolean; onClick: () => void }
>(function FilterButton({ count, label, expanded, onClick }, ref) {
  return (
    <button
      ref={ref}
      className="icon-btn icon-btn--line"
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={label}
      style={{ width: "44px", height: "44px" }}
    >
      <Icon name="filter" />
      {count > 0 && (
        <span className="badge badge--count" style={{ position: "absolute", top: "-6px", insetInlineEnd: "-6px" }}>
          {toArabicDigits(count)}
        </span>
      )}
    </button>
  );
});

export function WireHeader({
  wire,
  searchRef,
  filterRef,
  filterOpen,
  onToggleFilter,
  onBriefing,
}: {
  wire: Wire;
  searchRef: RefObject<HTMLInputElement | null>;
  filterRef: RefObject<HTMLButtonElement | null>;
  filterOpen: boolean;
  onToggleFilter: () => void;
  onBriefing: () => void;
}) {
  const { filters, setFilters } = wire;
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "18px 20px 12px" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="col" style={{ gap: "2px" }}>
          <h1 className="t-title" style={{ fontSize: "22px" }}>
            {COPY.title}
          </h1>
          <p className="live">{wire.live}</p>
        </div>
        <div className="row" style={{ gap: "4px" }}>
          <button className="icon-btn" type="button" aria-label={COPY.refresh} onClick={() => void wire.refresh()}>
            <Icon name="refresh" />
          </button>
          <BriefingButton onClick={onBriefing} />
        </div>
      </div>
      <div className="row">
        <label className="field field--sunken grow">
          <Icon name="search" />
          <span className="sr">{COPY.searchLabelDesk}</span>
          <input
            ref={searchRef}
            type="search"
            placeholder={COPY.searchPlaceholder}
            value={wire.query}
            onChange={(event) => wire.setQuery(event.target.value)}
          />
          <span className="kbd" style={{ background: "var(--surface)", color: "var(--ink-3)" }}>
            /
          </span>
        </label>
        <FilterButton
          ref={filterRef}
          count={wire.activeCount}
          label={filterButtonLabel(wire.activeCount)}
          expanded={filterOpen}
          onClick={onToggleFilter}
        />
      </div>
      <Segmented
        block
        role="group"
        aria-label={COPY.timeGroup}
        options={TIME_OPTIONS}
        value={filters.time}
        onChange={(time) => setFilters({ ...filters, time })}
      />
      <div className="scroll-x" role="group" aria-label={COPY.topicGroup}>
        <TopicChips topics={wire.topics} onPick={(topic) => setFilters({ ...filters, topic })} />
      </div>
    </header>
  );
}
