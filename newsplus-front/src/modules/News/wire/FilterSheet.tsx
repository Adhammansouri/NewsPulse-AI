// Mobile filters (MobFilters): bottom `sheet` — time and language segments, the source list with its search,
// and the sticky «عرض {N} عناوين». Filters apply as they are picked (URL). Inline styles are the board's own.
import { useId, useMemo, useState } from "react";
import type { NewsSource } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { Check } from "@/ui/Check";
import { Icon } from "@/ui/Icon";
import { Segmented } from "@/ui/Segmented";
import { Sheet } from "@/ui/Sheet";
import { SourceMark } from "@/ui/SourceMarks";
import { toArabicDigits } from "@/utils/arabic";
import { COPY, LANGUAGE_LABELS, ofTotal, showCountLabel } from "./copy";
import { toggleSource, type WireFilters } from "./filters";
import { LANGUAGE_OPTIONS } from "./FilterPopover";
import { sourceMark } from "./rows";
import { TIME_OPTIONS } from "./WireHeader";

const FIELDSET = { border: 0, padding: 0, margin: 0 } as const;

export function FilterSheet({
  open,
  onClose,
  filters,
  setFilters,
  sources,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: WireFilters;
  setFilters: (next: WireFilters) => void;
  sources: NewsSource[];
  /** Headlines matching the filters right now (the CTA's live count). */
  resultCount: number;
}) {
  const titleId = useId();
  const [sourceQuery, setSourceQuery] = useState("");
  const close = () => {
    setSourceQuery("");
    onClose();
  };

  const needle = sourceQuery.trim().toLowerCase();
  const listed = useMemo(
    () => (needle ? sources.filter((source) => source.name.toLowerCase().includes(needle)) : sources),
    [sources, needle],
  );

  return (
    <Sheet
      open={open}
      onClose={close}
      scrimLabel={COPY.closeFilters}
      aria-labelledby={titleId}
      className="col"
      // Board: 780px on a 844px screen; shorter screens keep the same 64px above the sheet.
      style={{ maxHeight: "min(780px, calc(100% - 64px))" }}
    >
      <header className="row" style={{ justifyContent: "space-between", padding: "6px 20px 14px" }}>
        <h2 id={titleId} className="t-title">
          {COPY.sheetTitle}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, time: "all", lang: "all", src: [] })}>
          {COPY.clearAll}
        </Button>
      </header>
      <div className="m-scroll col" style={{ padding: "0 20px 18px", gap: "22px" }}>
        <fieldset className="col" style={{ ...FIELDSET, gap: "8px" }}>
          <legend className="t-label" style={{ marginBottom: "8px" }}>
            {COPY.timeGroup}
          </legend>
          <Segmented block options={TIME_OPTIONS} value={filters.time} onChange={(time) => setFilters({ ...filters, time })} />
        </fieldset>
        <fieldset className="col" style={{ ...FIELDSET, gap: "8px" }}>
          <legend className="t-label" style={{ marginBottom: "8px" }}>
            {COPY.language}
          </legend>
          <Segmented
            block
            options={LANGUAGE_OPTIONS}
            value={filters.lang}
            onChange={(lang) => setFilters({ ...filters, lang })}
          />
        </fieldset>
        <fieldset className="col" style={{ ...FIELDSET, gap: "10px" }}>
          <legend className="row" style={{ marginBottom: "8px", width: "100%", justifyContent: "space-between" }}>
            <span className="t-label">{COPY.sources}</span>
            <span className="t-meta">{ofTotal(toArabicDigits(filters.src.length), toArabicDigits(sources.length))}</span>
          </legend>
          <label className="field field--sunken">
            <Icon name="search" />
            <span className="sr">{COPY.sourceSearchLabel}</span>
            <input
              type="search"
              placeholder={COPY.sourceSearchPlaceholder}
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
            />
          </label>
          <div className="m-list">
            {listed.map((source) => {
              const mark = sourceMark(source);
              const on = filters.src.includes(source.id);
              return (
                <button
                  key={source.id}
                  className="m-item"
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilters(toggleSource(filters, source.id))}
                >
                  <SourceMark
                    ch={mark.ch}
                    bg={mark.bg}
                    style={{ width: "30px", height: "30px", borderRadius: "9px" }}
                  />
                  <span className="m-item__label">
                    {source.name}
                    <small>{LANGUAGE_LABELS[source.language]}</small>
                  </span>
                  <Check checked={on} />
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
      <div className="m-cta">
        <Button variant="ink" size="lg" block onClick={close}>
          {showCountLabel(resultCount)}
        </Button>
      </div>
    </Sheet>
  );
}
