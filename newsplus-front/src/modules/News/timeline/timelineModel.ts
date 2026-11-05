// View model of «تطور القصة» (NewTimeline / MobNewTimeline) and «المصادر», from `TimelineData` and the story.
import type { NewsFeedItem, NewsSource, SourceConflict, TimelineData, TimelineEntry } from "@newsplus/shared";
import type { SourceMarkData } from "@/ui/SourceMarks";
import { clockAr, relativeTimeAr } from "@/utils/arabic";
import { sourceMark } from "../wire/rows";
import { sourceTagMob, tagLabelDesk, TIMELINE_COPY } from "./copy";

export type StoryTab = "story" | "timeline" | "sources";

export type SourceInfo = { name: string; mark: SourceMarkData; url?: string };
export type SourceLookup = (sourceId: string) => SourceInfo;

/** Names, marks and links: the story's own source links first, then the newsroom's source list, then the id. */
export function sourceLookup(item: Pick<NewsFeedItem, "sources"> | null, sources: readonly Pick<NewsSource, "id" | "name">[]): SourceLookup {
  const links = new Map((item?.sources ?? []).map((source) => [source.id, source]));
  const names = new Map(sources.map((source) => [source.id, source.name]));
  return (sourceId) => {
    const name = links.get(sourceId)?.name ?? names.get(sourceId) ?? sourceId;
    return { name, mark: sourceMark({ id: sourceId, name }), url: links.get(sourceId)?.url };
  };
}

export type TimelineRow = {
  key: string;
  /** «٢:٥٢ م» */
  time: string;
  /** `tl__item` modifier: the first report (coral) or a new entry (teal). */
  dot: "is-first" | "is-new" | "";
  source: SourceInfo;
  /** Desktop badge («أول من نشر», «جديد · رد فعل»); "" = none. */
  tag: string;
  /** Mobile meta «العربية · أول من نشر». */
  metaMob: string;
  headline: string;
};

export type TimelineView = {
  count: number;
  rows: TimelineRow[];
  /** «٤ تحديثات خلال ١٢ دقيقة · آخر تحديث قبل دقيقة» ("" without entries). */
  meta: string;
  /** «٤ تحديثات في ١٢ دقيقة» */
  metaMob: string;
};

const MINUTE_MS = 60_000;

export function timelineView(data: TimelineData, lookup: SourceLookup, now = new Date()): TimelineView {
  const entries = data.entries;
  const rows = entries.map((entry, index): TimelineRow => {
    const source = lookup(entry.sourceId);
    return {
      key: `${entry.sourceId}-${entry.at}-${index}`,
      time: clockAr(new Date(entry.at)),
      dot: index === 0 ? "is-first" : entry.isNew ? "is-new" : "",
      source,
      tag: tagLabelDesk(entry.tag, entry.isNew),
      metaMob: sourceTagMob(source.name, entry.tag, entry.isNew),
      headline: entry.headline,
    };
  });
  const first = entries[0];
  const last = entries.at(-1);
  if (!first || !last) return { count: 0, rows, meta: "", metaMob: "" };
  const minutes = Math.max(1, Math.round((Date.parse(last.at) - Date.parse(first.at)) / MINUTE_MS));
  return {
    count: entries.length,
    rows,
    meta: TIMELINE_COPY.meta(entries.length, minutes, relativeTimeAr(last.at, now)),
    metaMob: TIMELINE_COPY.metaMob(entries.length, minutes),
  };
}

export type ConflictView = {
  key: string;
  conflict: SourceConflict;
  values: Array<{ sourceId: string; value: string; source: SourceInfo }>;
};

export function conflictViews(data: TimelineData, lookup: SourceLookup): ConflictView[] {
  return data.conflicts.map((conflict, index) => ({
    key: `${conflict.field}-${index}`,
    conflict,
    values: conflict.values.map((entry) => ({ ...entry, source: lookup(entry.sourceId) })),
  }));
}

/** The newest entry published after the draft was last written, if any. */
export function entryAfter(entries: readonly TimelineEntry[], draftAt: string | null | undefined): TimelineEntry | null {
  if (!draftAt) return null;
  const since = Date.parse(draftAt);
  if (!Number.isFinite(since)) return null;
  let newest: TimelineEntry | null = null;
  for (const entry of entries) {
    const at = Date.parse(entry.at);
    if (at > since && (!newest || at >= Date.parse(newest.at))) newest = entry;
  }
  return newest;
}

const HEADLINE_MAX = 240;

/** «حدّث المسودة»: the revision request carrying the new update, attributed to its source. */
export function updateInstruction(entry: TimelineEntry, sourceName: string): string {
  const headline = entry.headline.replace(/\s+/g, " ").trim().slice(0, HEADLINE_MAX);
  return `أضف التحديث الجديد من ${sourceName} منسوباً إليه: «${headline}»`;
}

export type SourceRow = { key: string; source: SourceInfo; url: string; time: string };

/** «المصادر»: one link per source of the story, in the order they reported it (timeline), then the rest. */
export function sourceRows(item: Pick<NewsFeedItem, "sources">, entries: readonly TimelineEntry[], lookup: SourceLookup): SourceRow[] {
  const firstAt = new Map<string, string>();
  for (const entry of entries) if (!firstAt.has(entry.sourceId)) firstAt.set(entry.sourceId, entry.at);
  const seen = new Set<string>();
  const rows = item.sources
    .filter((link) => (seen.has(link.id) ? false : (seen.add(link.id), true)))
    .map((link) => {
      const at = firstAt.get(link.id);
      return { key: link.id, source: lookup(link.id), url: link.url, time: at ? clockAr(new Date(at)) : "", at: at ? Date.parse(at) : Infinity };
    });
  rows.sort((a, b) => a.at - b.at);
  return rows.map(({ at: _at, ...row }) => row);
}
