import { CaretDown, MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import { useState } from "react";
import type { NewsLanguage, NewsSource } from "@newsplus/shared";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { TIME_FILTERS, TOPIC_FILTERS, type TimeFilter, type TopicFilter } from "../newsFormat";
import { SourceMark } from "../SourceMark";
import { SourceSheet } from "./SourceSheet";

export type FeedFilters = {
  query: string;
  language: "all" | NewsLanguage;
  source: string;
  time: TimeFilter;
  topic: TopicFilter;
};

const LANGS = [
  { id: "all" as const, label: "الكل" },
  { id: "ar" as const, label: "عربي" },
  { id: "en" as const, label: "English" },
];

export function NewsToolbar({
  filters,
  sources,
  timeCounts,
  topicCounts,
  onChange,
}: {
  filters: FeedFilters;
  sources: NewsSource[];
  timeCounts: Record<TimeFilter, number>;
  topicCounts: Record<TopicFilter, number>;
  onChange: (patch: Partial<FeedFilters>) => void;
}) {
  const [sheet, setSheet] = useState<"filters" | "sources" | null>(null);
  const visibleSources = sources.filter((source) => filters.language === "all" || source.language === filters.language);
  const selectedSource = sources.find((source) => source.id === filters.source);
  const activeCount = [filters.language !== "all", filters.source !== "all", filters.time !== "all"].filter(Boolean).length;
  const anyActive = activeCount > 0 || filters.topic !== "all";

  const timeOptions = TIME_FILTERS.map((option) => ({ id: option.id, label: option.label, count: timeCounts[option.id], title: option.hint, ariaLabel: `${option.hint}، ${timeCounts[option.id]} عنوان` }));
  const reset = () => onChange({ language: "all", source: "all", time: "all", topic: "all" });

  const sourceButton = (
    <button type="button" className="btn btn-quiet nr-source-btn" onClick={() => setSheet("sources")} aria-haspopup="dialog">
      {selectedSource ? <SourceMark id={selectedSource.id} name={selectedSource.name} size={20} /> : null}
      <span className="truncate">{selectedSource ? selectedSource.name : "كل المصادر"}</span>
      <CaretDown size={14} weight="bold" aria-hidden="true" />
    </button>
  );

  return (
    <div className="nr-filters">
      <div className="nr-filter-row">
        <div className="input-wrap nr-search">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="news-query">بحث في العناوين</label>
          <input id="news-query" className="input" type="search" value={filters.query} onChange={(event) => onChange({ query: event.target.value })} placeholder="ابحث عن خبر أو موضوع…" autoComplete="off" />
          {filters.query ? (
            <button type="button" className="icon-btn is-sm input-end" aria-label="مسح البحث" onClick={() => onChange({ query: "" })}>
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Desktop: everything inline */}
        <div className="nr-inline">
          <Segmented value={filters.time} options={timeOptions} onChange={(time) => onChange({ time })} ariaLabel="تصفية الوقت" size="sm" />
          <Segmented value={filters.language} options={LANGS} onChange={(language) => onChange({ language, source: "all" })} ariaLabel="تصفية اللغة" size="sm" />
          {sourceButton}
        </div>

        {/* Mobile: one button, everything in a sheet */}
        <button type="button" className={`btn btn-quiet nr-filter-btn ${activeCount ? "has-active" : ""}`} onClick={() => setSheet("filters")} aria-haspopup="dialog">
          <SlidersHorizontal size={18} aria-hidden="true" />
          تصفية
          {activeCount ? <span className="badge badge-brand">{activeCount}</span> : null}
        </button>
      </div>

      <div className="chip-scroll nr-topics" role="group" aria-label="تصفية الموضوع">
        {TOPIC_FILTERS.map((option) => {
          const count = topicCounts[option.id];
          return (
            <button
              key={option.id}
              type="button"
              className={`chip ${filters.topic === option.id ? "is-active" : ""}`}
              aria-pressed={filters.topic === option.id}
              aria-label={`${option.label}، ${count} عنوان`}
              disabled={option.id !== "all" && count === 0}
              onClick={() => onChange({ topic: option.id })}
            >
              {option.label}
              <span className="count"><bdi>{count}</bdi></span>
            </button>
          );
        })}
        {anyActive ? (
          <button type="button" className="chip nr-reset" onClick={reset}>
            <X size={14} weight="bold" aria-hidden="true" />
            مسح التصفية
          </button>
        ) : null}
      </div>

      <Sheet open={sheet === "filters"} onClose={() => setSheet(null)} title="تصفية العناوين" variant="center">
        <div className="filter-sheet">
          <div className="field">
            <span className="field-label">الوقت</span>
            <Segmented value={filters.time} options={timeOptions} onChange={(time) => onChange({ time })} ariaLabel="تصفية الوقت" size="sm" block />
          </div>
          <div className="field">
            <span className="field-label">اللغة</span>
            <Segmented value={filters.language} options={LANGS} onChange={(language) => onChange({ language, source: "all" })} ariaLabel="تصفية اللغة" block />
          </div>
          <div className="field">
            <span className="field-label">المصدر</span>
            <button type="button" className="btn btn-quiet nr-source-btn" onClick={() => setSheet("sources")}>
              {selectedSource ? <SourceMark id={selectedSource.id} name={selectedSource.name} size={20} /> : null}
              <span className="truncate">{selectedSource ? selectedSource.name : "كل المصادر"}</span>
              <CaretDown size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <div className="filter-sheet-actions">
            <button type="button" className="btn btn-primary" onClick={() => setSheet(null)}>عرض النتائج</button>
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={!anyActive}>مسح التصفية</button>
          </div>
        </div>
      </Sheet>

      <SourceSheet
        open={sheet === "sources"}
        sources={visibleSources}
        selectedId={filters.source}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          const source = sources.find((entry) => entry.id === id);
          onChange({ source: id, ...(source ? { language: source.language } : {}) });
        }}
      />
    </div>
  );
}
