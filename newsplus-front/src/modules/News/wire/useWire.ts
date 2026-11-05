// State of the headline wire (S04): feed + sources + drafts queries, URL filters, debounced search,
// the «عناوين جديدة» hold-back and the designed states. Desktop (WireColumn) and mobile (MobWire)
// render the same model.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { NewsFeedItem, NewsSource } from "@newsplus/shared";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { usePreferences } from "@/hooks/usePreferences";
import { listEditorialConversations } from "@/services/editorialService";
import { getNewsSources } from "@/services/newsService";
import { clockAr, countPhrase, relativeTimeAr, type CountForms } from "@/utils/arabic";
import type { TimeFilter, TopicFilter } from "../newsFormat";
import { emptyText, LANGUAGE_LABELS, liveLine, TIME_SPANS, WIDEN_TO_ALL, WIRE_TOPIC_ORDER, COPY } from "./copy";
import {
  activeFilterCount,
  applyFilters,
  DEFAULT_FILTERS,
  defaultSources,
  readFilters,
  sourceLanguages,
  widerTime,
  writeFilters,
  type SourceLanguages,
  type WireFilters,
} from "./filters";
import { toRowModel, topicLabel, type WireRowModel } from "./rows";

/** Search enters the feed query key after this pause (S04 §8). */
export const SEARCH_DEBOUNCE_MS = 300;
/** Relative times («قبل ٣ دقائق», «حُدّث قبل دقيقة») are re-read once a minute. */
const CLOCK_TICK_MS = 60_000;

const SOURCE_COUNT: CountForms = { one: "مصدر واحد", two: "مصدرين", few: "{n} مصادر", many: "{n} مصدر" };

export type WireTopic = { id: TopicFilter; label: string; count: number | null; pressed: boolean };
export type WireChip = { key: string; label: string; clear: () => void };
export type WireEmpty = {
  text: string;
  /** «وسّع الوقت لساعة»: the next wider time filter. */
  widen: { label: string; time: TimeFilter } | null;
  /** «امسح التصفية» clears every filter and the search. */
  canClear: boolean;
  /** MobWire-empty: the active filters as removable chips. */
  chips: WireChip[];
};

export type Wire = {
  /** First load in flight (no rows yet). */
  loading: boolean;
  /** The last fetch failed; `rows` keep the cached copy. */
  failed: boolean;
  /** «٢:٤٠ م» — when the copy on screen was fetched. */
  savedClock: string | null;
  live: string;
  rows: WireRowModel[];
  /** Polled items held back behind the pill (matching the filters). */
  newCount: number;
  revealNew: () => void;
  filters: WireFilters;
  setFilters: (next: WireFilters) => void;
  /** Filter button badge (see `activeFilterCount`). */
  activeCount: number;
  topics: WireTopic[];
  sources: NewsSource[];
  languages: SourceLanguages;
  query: string;
  setQuery: (value: string) => void;
  /** Refetch, then show what arrived (refresh button, «حاول تاني», pull-to-refresh). */
  refresh: () => Promise<void>;
  empty: WireEmpty | null;
  clearAll: () => void;
  /** Every item of the feed, held-back ones included (selection lookup). */
  allItems: NewsFeedItem[];
  /** The scrolling list: «عناوين جديدة» scrolls it back to the top. */
  listRef: RefObject<HTMLElement | null>;
};

/** What is on screen: ids shown so far + the newest publish time among them. Newer, unseen items wait. */
type Baseline = { key: string; ids: ReadonlySet<string>; newest: number };

const EMPTY_SET: ReadonlySet<string> = new Set();

function publishTime(item: NewsFeedItem) {
  const time = Date.parse(item.publishedAt);
  return Number.isFinite(time) ? time : null;
}

function baselineOf(key: string, items: readonly NewsFeedItem[], previous?: Baseline): Baseline {
  let newest = previous?.newest ?? Number.NEGATIVE_INFINITY;
  for (const item of items) newest = Math.max(newest, publishTime(item) ?? newest);
  return { key, ids: new Set(items.map((item) => item.id)), newest };
}

function isShown(item: NewsFeedItem, base: Baseline | null) {
  if (!base || base.ids.has(item.id)) return true;
  const time = publishTime(item);
  return time === null || time <= base.newest;
}

function useMinuteClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function useWire({ mobile, initialQuery = "" }: { mobile: boolean; initialQuery?: string }): Wire {
  const [searchParams, setSearchParams] = useSearchParams();
  /** Mobile, back from a story: the search the list had (listMemory.ts). */
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const listRef = useRef<HTMLElement | null>(null);
  const tick = useMinuteClock();

  const feedQuery = useNewsFeed("all", debouncedQuery);
  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  // Same key as the archive drawer's unfiltered list: the «مسودة جاهزة» badge.
  const draftsQuery = useQuery({
    queryKey: ["editorial-conversations", ""],
    queryFn: () => listEditorialConversations(""),
  });

  const data = feedQuery.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const sources = useMemo(() => sourcesQuery.data?.sources ?? [], [sourcesQuery.data]);
  const languages = useMemo(() => sourceLanguages(sources), [sources]);
  // S16: the sources the editor follows are the default source filter (`src` absent from the URL).
  const followed = usePreferences().data?.sources;
  const defaultSrc = useMemo(() => defaultSources(followed, sources), [followed, sources]);
  const filters = useMemo(() => readFilters(searchParams, defaultSrc), [searchParams, defaultSrc]);
  const drafts = useMemo(
    () => new Set((draftsQuery.data?.items ?? []).flatMap((c) => (c.itemId ? [c.itemId] : []))),
    [draftsQuery.data],
  );

  // A new search shows its results at once; polls of the same search hold new items back.
  const settledKey = feedQuery.isPlaceholderData ? null : debouncedQuery;
  const [base, setBase] = useState<Baseline | null>(null);
  const [arrived, setArrived] = useState<ReadonlySet<string>>(EMPTY_SET);
  if (data && settledKey !== null && base?.key !== settledKey) {
    setBase(baselineOf(settledKey, data.items));
    setArrived(EMPTY_SET);
  }
  const baseRef = useRef(base);
  useEffect(() => {
    baseRef.current = base;
  });

  const shown = useMemo(() => items.filter((item) => isShown(item, base)), [items, base]);
  const held = useMemo(() => items.filter((item) => !isShown(item, base)), [items, base]);

  // `tick` is a dependency on purpose: the time window is re-applied as items age out of it.
  const filtered = useMemo(() => applyFilters(shown, filters, languages), [shown, filters, languages, tick]);
  const now = Math.max(tick, feedQuery.dataUpdatedAt);
  const rows = useMemo(
    () => filtered.map((item) => toRowModel(item, { languages, drafts, arrived, now })),
    [filtered, languages, drafts, arrived, now],
  );
  const newCount = useMemo(() => applyFilters(held, filters, languages).length, [held, filters, languages]);

  const scrollListTop = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, []);

  /** Inserts every held-back item of `latest` (class `arrive`), never touching the selection. */
  const showAll = useCallback((latest: readonly NewsFeedItem[]) => {
    const current = baseRef.current;
    if (!current) return;
    const incoming = latest.filter((item) => !isShown(item, current)).map((item) => item.id);
    const next = baselineOf(current.key, latest, current);
    baseRef.current = next;
    setBase(next);
    if (incoming.length > 0) setArrived(new Set(incoming));
  }, []);

  const revealNew = useCallback(() => {
    showAll(items);
    scrollListTop();
  }, [items, showAll, scrollListTop]);

  const { refetch } = feedQuery;
  const refresh = useCallback(async () => {
    const result = await refetch();
    if (result.isSuccess && result.data) {
      showAll(result.data.items);
      scrollListTop();
    }
  }, [refetch, showAll, scrollListTop]);

  const setFilters = useCallback(
    (next: WireFilters) => setSearchParams((prev) => writeFilters(prev, next, defaultSrc), { replace: true }),
    [setSearchParams, defaultSrc],
  );

  const clearAll = useCallback(() => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  const loading = feedQuery.isPending;
  const failed = feedQuery.isError;

  const topics = useMemo<WireTopic[]>(() => {
    if (loading) return [{ id: "all", label: topicLabelOf("all"), count: null, pressed: filters.topic === "all" }];
    const pool = applyFilters(shown, filters, languages, "topic");
    const counts = new Map<TopicFilter, number>([["all", pool.length]]);
    for (const item of pool) {
      const id = WIRE_TOPIC_ORDER.includes(item.topic) ? item.topic : "other";
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return WIRE_TOPIC_ORDER.filter((id) => id === "all" || id === filters.topic || (counts.get(id) ?? 0) > 0).map(
      (id) => ({ id, label: topicLabelOf(id), count: counts.get(id) ?? 0, pressed: filters.topic === id }),
    );
  }, [loading, shown, filters, languages]);

  const empty = useMemo<WireEmpty | null>(() => {
    if (loading || !data || rows.length > 0) return null;
    const time = filters.time === "all" ? null : filters.time;
    const topic = filters.topic === "all" ? null : topicLabelOf(filters.topic);
    let lastSeen: string | null = null;
    if (time) {
      const latest = applyFilters(shown, filters, languages, "time").reduce<NewsFeedItem | null>(
        (best, item) => (best && (publishTime(best) ?? 0) >= (publishTime(item) ?? 0) ? best : item),
        null,
      );
      if (latest) lastSeen = relativeTimeAr(latest.publishedAt, new Date(now));
    }
    const wider = widerTime(filters.time);
    const chips: WireChip[] = [];
    if (time) chips.push({ key: "time", label: TIME_SPANS[time].chip, clear: () => setFilters({ ...filters, time: "all" }) });
    if (topic) chips.push({ key: "topic", label: topic, clear: () => setFilters({ ...filters, topic: "all" }) });
    if (filters.lang !== "all") {
      chips.push({ key: "lang", label: LANGUAGE_LABELS[filters.lang], clear: () => setFilters({ ...filters, lang: "all" }) });
    }
    if (filters.src.length > 0) {
      const only = filters.src.length === 1 ? sources.find((source) => source.id === filters.src[0]) : undefined;
      chips.push({
        key: "src",
        label: only?.name ?? countPhrase(filters.src.length, SOURCE_COUNT),
        clear: () => setFilters({ ...filters, src: [] }),
      });
    }
    return {
      text: emptyText({ mobile, topic, time, sourcesSelected: filters.src.length > 0, lastSeen }),
      widen: wider
        ? { time: wider, label: wider === "all" ? WIDEN_TO_ALL : (TIME_SPANS[wider].widen ?? WIDEN_TO_ALL) }
        : null,
      canClear: chips.length > 0 || debouncedQuery.length > 0,
      chips,
    };
  }, [loading, data, rows.length, filters, shown, languages, now, mobile, sources, setFilters, debouncedQuery]);

  const liveCount = shown.length;
  let live: string;
  if (loading) live = COPY.loadingLine;
  else if (!data || (failed && mobile)) live = COPY.offlineLine;
  else live = mobile ? liveLine(liveCount) : liveLine(liveCount, relativeTimeAr(data.fetchedAt, new Date(now)));

  return {
    loading,
    failed,
    savedClock: data && feedQuery.dataUpdatedAt > 0 ? clockAr(new Date(feedQuery.dataUpdatedAt)) : null,
    live,
    rows,
    newCount,
    revealNew,
    filters,
    setFilters,
    activeCount: activeFilterCount(filters, mobile),
    topics,
    sources,
    languages,
    query,
    setQuery,
    refresh,
    empty,
    clearAll,
    allItems: items,
    listRef,
  };
}

function topicLabelOf(id: TopicFilter) {
  return id === "all" ? "الكل" : topicLabel(id);
}
