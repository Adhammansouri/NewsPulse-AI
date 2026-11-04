// Wire filters (S04 §5): time · topic · language · sources, kept in the URL query
// (`?time=&topic=&lang=&src=a,b`) so they survive a reload. The API takes one `source`, so the wire fetches
// the whole feed and filters it here — multi-source selection included.
import type { NewsFeedItem, NewsLanguage, NewsSource } from "@newsplus/shared";
import {
  hasArabic,
  matchesTimeFilter,
  matchesTopicFilter,
  TIME_FILTERS,
  TOPIC_FILTERS,
  type TimeFilter,
  type TopicFilter,
} from "../newsFormat";

export type LangFilter = "all" | NewsLanguage;

export type WireFilters = {
  time: TimeFilter;
  topic: TopicFilter;
  lang: LangFilter;
  /** Selected source ids; empty = every source. */
  src: string[];
};

export const DEFAULT_FILTERS: WireFilters = { time: "all", topic: "all", lang: "all", src: [] };

/** URL keys of the filters (the story deep link `item` sits next to them). */
const KEYS = { time: "time", topic: "topic", lang: "lang", src: "src" } as const;

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function readFilters(params: URLSearchParams): WireFilters {
  const src = (params.get(KEYS.src) ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return {
    time: oneOf(params.get(KEYS.time), TIME_FILTERS.map((f) => f.id), "all"),
    topic: oneOf(params.get(KEYS.topic), TOPIC_FILTERS.map((f) => f.id), "all"),
    lang: oneOf<LangFilter>(params.get(KEYS.lang), ["all", "ar", "en"], "all"),
    src: [...new Set(src)],
  };
}

/** A copy of `params` with the filters written in; defaults are left out of the URL. */
export function writeFilters(params: URLSearchParams, filters: WireFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string, fallback: string) => {
    if (value === fallback) next.delete(key);
    else next.set(key, value);
  };
  set(KEYS.time, filters.time, "all");
  set(KEYS.topic, filters.topic, "all");
  set(KEYS.lang, filters.lang, "all");
  set(KEYS.src, filters.src.join(","), "");
  return next;
}

/** Source id → language, from `/news/sources`. */
export type SourceLanguages = ReadonlyMap<string, NewsLanguage>;

export function sourceLanguages(sources: readonly NewsSource[]): SourceLanguages {
  return new Map(sources.map((source) => [source.id, source.language]));
}

/** An item's language: its lead source's, else what its title is written in. */
export function itemLanguage(item: NewsFeedItem, languages: SourceLanguages): NewsLanguage {
  const lead = item.sources[0] ? languages.get(item.sources[0].id) : undefined;
  return lead ?? (hasArabic(item.title) ? "ar" : "en");
}

function matchesLanguage(item: NewsFeedItem, lang: LangFilter, languages: SourceLanguages) {
  if (lang === "all") return true;
  const known = item.sources.map((source) => languages.get(source.id)).filter(Boolean);
  return known.length > 0 ? known.includes(lang) : itemLanguage(item, languages) === lang;
}

function matchesSources(item: NewsFeedItem, src: readonly string[]) {
  return src.length === 0 || item.sources.some((source) => src.includes(source.id));
}

/** Items passing the filters; `ignore` leaves one dimension out (topic counts, «آخر خبر كان…»). */
export function applyFilters(
  items: readonly NewsFeedItem[],
  filters: WireFilters,
  languages: SourceLanguages,
  ignore?: "time" | "topic",
): NewsFeedItem[] {
  return items.filter(
    (item) =>
      (ignore === "time" || matchesTimeFilter(item.publishedAt, filters.time)) &&
      (ignore === "topic" || matchesTopicFilter(item.topic, filters.topic)) &&
      matchesLanguage(item, filters.lang, languages) &&
      matchesSources(item, filters.src),
  );
}

/**
 * Badge of the filter button. Desktop (Main «تصفية، فلتر واحد مفعّل»): what the popover holds — language +
 * sources. Mobile (MobWire-empty «٢» with «آخر ٢٠ دقيقة» + «اقتصاد»): every active filter, time and topic too.
 */
export function activeFilterCount(filters: WireFilters, mobile: boolean): number {
  const popover = (filters.lang !== "all" ? 1 : 0) + (filters.src.length > 0 ? 1 : 0);
  if (!mobile) return popover;
  return popover + (filters.time !== "all" ? 1 : 0) + (filters.topic !== "all" ? 1 : 0);
}

/** The next wider time filter, for «وسّع الوقت …» (none once every time is shown). */
export function widerTime(time: TimeFilter): TimeFilter | null {
  const index = TIME_FILTERS.findIndex((filter) => filter.id === time);
  if (time === "all" || index < 0) return null;
  return TIME_FILTERS[index + 1]?.id ?? "all";
}

export function toggleSource(filters: WireFilters, id: string): WireFilters {
  const src = filters.src.includes(id) ? filters.src.filter((x) => x !== id) : [...filters.src, id];
  return { ...filters, src };
}
