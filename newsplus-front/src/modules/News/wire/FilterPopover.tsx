// Desktop filters (Main-filters): `popover` under the search row — language segments and the source tiles.
// Filters apply as they are picked (URL); «عرض النتائج» closes the popover. Inline styles are the board's own.
import type { RefObject } from "react";
import type { NewsSource } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { Popover } from "@/ui/Popover";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { SourceMark } from "@/ui/SourceMarks";
import { COPY, LANGUAGE_LABELS } from "./copy";
import { toggleSource, type LangFilter, type WireFilters } from "./filters";
import { sourceMark } from "./rows";

export const LANGUAGE_OPTIONS: ReadonlyArray<SegmentedOption<LangFilter>> = (["all", "ar", "en"] as const).map(
  (value) => ({ value, label: LANGUAGE_LABELS[value] }),
);

export function FilterPopover({
  open,
  onClose,
  anchorRef,
  filters,
  setFilters,
  sources,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  filters: WireFilters;
  setFilters: (next: WireFilters) => void;
  sources: NewsSource[];
}) {
  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      aria-label={COPY.popoverTitle}
      style={{
        top: "132px",
        insetInline: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        // Not on the board (six sources there): with the full source list the grid scrolls inside the column.
        maxHeight: "calc(100% - 148px)",
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="t-head">{COPY.popoverTitle}</h2>
        <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, lang: "all", src: [] })}>
          {COPY.clearAll}
        </Button>
      </div>
      <div className="col" style={{ gap: "6px" }}>
        <span className="t-label">{COPY.language}</span>
        <Segmented
          block
          options={LANGUAGE_OPTIONS}
          value={filters.lang}
          onChange={(lang) => setFilters({ ...filters, lang })}
        />
      </div>
      <div className="col" style={{ gap: "8px", minHeight: 0 }}>
        <span className="t-label">{COPY.sources}</span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "6px",
            overflowY: "auto",
          }}
        >
          {sources.map((source) => {
            const mark = sourceMark(source);
            return (
              <button
                key={source.id}
                className="tile tile--row"
                type="button"
                aria-pressed={filters.src.includes(source.id)}
                onClick={() => setFilters(toggleSource(filters, source.id))}
                style={{ padding: "8px", gap: "8px", boxShadow: "none" }}
              >
                <SourceMark ch={mark.ch} bg={mark.bg} style={{ width: "26px", height: "26px" }} />
                <span className="grow" style={{ fontSize: "13px", fontWeight: 600 }}>
                  {source.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <Button variant="ink" block onClick={onClose}>
        {COPY.showResults}
      </Button>
    </Popover>
  );
}
