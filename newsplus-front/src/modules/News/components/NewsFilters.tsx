import { useId, useState } from "react";
import { MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import type { NewsLanguage, NewsSource } from "@newsplus/shared";
import { TIME_FILTERS, TOPIC_FILTERS, type TimeFilter, type TopicFilter } from "../newsFormat";
import { SourceMark } from "../SourceMark";
import { SourcePicker } from "./SourcePicker";

export type FeedFilters = {
  query: string;
  language: "all" | NewsLanguage;
  source: string;
  time: TimeFilter;
  topic: TopicFilter;
};

export function NewsFilters({ filters, sources, timeCounts, topicCounts, onChange }: {
  filters: FeedFilters;
  sources: NewsSource[];
  timeCounts: Record<TimeFilter, number>;
  topicCounts: Record<TopicFilter, number>;
  onChange: (patch: Partial<FeedFilters>) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const activeCount = [filters.language !== "all", filters.source !== "all", filters.time !== "all", filters.topic !== "all"].filter(Boolean).length;
  const visibleSources = sources.filter((source) => filters.language === "all" || source.language === filters.language);
  const selectedSource = sources.find((source) => source.id === filters.source);
  const activeFilters: Array<{ key: string; label: string; clear: Partial<FeedFilters> }> = [];
  if (filters.language !== "all") activeFilters.push({ key: "language", label: filters.language === "ar" ? "عربي" : "English", clear: { language: "all" } });
  if (selectedSource) activeFilters.push({ key: "source", label: selectedSource.name, clear: { source: "all" } });
  if (filters.topic !== "all") activeFilters.push({ key: "topic", label: TOPIC_FILTERS.find((option) => option.id === filters.topic)?.label ?? filters.topic, clear: { topic: "all" } });
  if (filters.time !== "all") activeFilters.push({ key: "time", label: TIME_FILTERS.find((option) => option.id === filters.time)?.hint ?? filters.time, clear: { time: "all" } });

  return (
    <div className="news-toolbar newsroom-filters">
      <div className="newsroom-search-row">
        <label className="news-search" htmlFor="news-query">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="sr-only">بحث في العناوين</span>
          <input id="news-query" type="search" value={filters.query} onChange={(event) => onChange({ query: event.target.value })} placeholder="ابحث عن خبر أو موضوع…" />
          {filters.query && <button type="button" className="news-icon-btn" aria-label="مسح البحث" onClick={() => onChange({ query: "" })}><X size={16} aria-hidden="true" /></button>}
        </label>
        <button type="button" className={`newsroom-filter-toggle ${activeCount ? "has-filters" : ""}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((current) => !current)}>
          <SlidersHorizontal size={18} aria-hidden="true" />
          تصفية
          {activeCount > 0 && <span className="newsroom-filter-count">{activeCount}</span>}
        </button>
      </div>

      <div className={`newsroom-filter-details ${open ? "is-open" : ""}`} id={panelId}>
        <div className="newsroom-filter-options">
          <div className="news-seg news-seg--lang" role="group" aria-label="تصفية اللغة">
            {([{ id: "all", label: "كل اللغات" }, { id: "ar", label: "عربي" }, { id: "en", label: "English" }] as const).map((option) => (
              <button key={option.id} type="button" className={`news-seg-btn ${filters.language === option.id ? "is-active" : ""}`} aria-pressed={filters.language === option.id} onClick={() => onChange({ language: option.id, source: "all" })}>
                <span lang={option.id === "en" ? "en" : "ar"}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="news-topic-rail" role="group" aria-label="تصفية الموضوع">
          {TOPIC_FILTERS.map((option) => {
            const count = topicCounts[option.id];
            return <button key={option.id} type="button" className={`news-chip ${filters.topic === option.id ? "is-active" : ""}`} aria-pressed={filters.topic === option.id} aria-label={`${option.label}، ${count} عنوان`} disabled={option.id !== "all" && count === 0} onClick={() => onChange({ topic: option.id })}>
              {option.label}<span className="news-seg-count"><bdi>{count}</bdi></span>
            </button>;
          })}
        </div>
      </div>

      <SourcePicker sources={visibleSources} selectedId={filters.source} onSelect={(id) => {
        const source = sources.find((entry) => entry.id === id);
        onChange({ source: id, ...(source ? { language: source.language } : {}) });
      }} />

      {activeFilters.length > 0 && <div className="newsroom-active-filters" role="group" aria-label="الفلاتر المفعّلة">
        {activeFilters.map((filter) => <button key={filter.key} type="button" className="newsroom-active-filter" aria-label={`إزالة فلتر ${filter.label}`} onClick={() => onChange(filter.clear)}>
          {filter.key === "source" && selectedSource && <SourceMark id={selectedSource.id} name={selectedSource.name} size={20} />}
          <bdi>{filter.label}</bdi><X size={14} aria-hidden="true" />
        </button>)}
        <button type="button" className="newsroom-reset" onClick={() => onChange({ language: "all", source: "all", time: "all", topic: "all" })}>مسح التصفية <X size={14} aria-hidden="true" /></button>
      </div>}

      <div className="news-seg news-seg--time" role="group" aria-label="تصفية الوقت">
        {TIME_FILTERS.map((option) => <button key={option.id} type="button" className={`news-seg-btn ${filters.time === option.id ? "is-active" : ""}`} aria-pressed={filters.time === option.id} aria-label={`${option.hint}، ${timeCounts[option.id]} عنوان`} title={option.hint} onClick={() => onChange({ time: option.id })}>
          {option.label}<span className="news-seg-count"><bdi>{timeCounts[option.id]}</bdi></span>
        </button>)}
      </div>
    </div>
  );
}
