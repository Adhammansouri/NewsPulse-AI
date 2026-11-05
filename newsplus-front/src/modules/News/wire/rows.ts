// View model of a wire row (S04 §3), shared by the desktop column (WireRow) and the mobile list (MobWire).
import type { NewsFeedItem, NewsFeedSourceLink, NewsSource } from "@newsplus/shared";
import type { SourceMarkData } from "@/ui/SourceMarks";
import { relativeTimeAr, relativeTimeArShort, toArabicDigits } from "@/utils/arabic";
import { sourceTone, TOPIC_FILTERS, wireFreshness, type WireFreshness } from "../newsFormat";
import { itemLanguage, type SourceLanguages } from "./filters";

/** Marks shown before the source name (sprint §3: at most two). */
export const MAX_ROW_MARKS = 2;

export type WireRowModel = {
  id: string;
  item: NewsFeedItem;
  title: string;
  dir: "rtl" | "ltr";
  freshness: WireFreshness;
  breaking: boolean;
  marks: SourceMarkData[];
  /** Lead source name. */
  source: string;
  /** «+٢» when other sources carry the story, else "". */
  more: string;
  topic: string;
  /** «قبل ٣ دقائق» (Main) */
  time: string;
  /** «قبل ٣ د» (MobWire) */
  timeShort: string;
  /** An editorial conversation exists for this item → «مسودة جاهزة». */
  draft: boolean;
  /** Just inserted from the «عناوين جديدة» pill → `arrive`. */
  arrive: boolean;
};

/**
 * The letter of a source mark, as the boards write it: the name's first letter, past the article «ال»
 * («العربية» → ع, «الجزيرة نت» → ج, «BBC عربي» → B, «Reuters» → R).
 */
export function markLetter(name: string): string {
  const bare = name.trim().replace(/^ال(?=[\u0600-\u06FF])/, "");
  const letter = bare.match(/[\u0600-\u06FFA-Za-z0-9]/)?.[0] ?? bare[0] ?? "?";
  return letter.toUpperCase();
}

/** A source's letter mark on the source tone (no colours come from the API). */
export function sourceMark(source: Pick<NewsSource | NewsFeedSourceLink, "id" | "name">): SourceMarkData {
  return { id: source.id, ch: markLetter(source.name), bg: sourceTone(source.id) };
}

export function topicLabel(topic: NewsFeedItem["topic"]): string {
  return (TOPIC_FILTERS.find((option) => option.id === topic) ?? TOPIC_FILTERS[TOPIC_FILTERS.length - 1]).label;
}

export function toRowModel(
  item: NewsFeedItem,
  ctx: { languages: SourceLanguages; drafts: ReadonlySet<string>; arrived: ReadonlySet<string>; now: number },
): WireRowModel {
  const others = item.sources.length - 1;
  return {
    id: item.id,
    item,
    title: item.title,
    dir: itemLanguage(item, ctx.languages) === "ar" ? "rtl" : "ltr",
    freshness: wireFreshness(item.publishedAt, item.breaking, ctx.now),
    breaking: item.breaking,
    marks: item.sources.slice(0, MAX_ROW_MARKS).map(sourceMark),
    source: item.sources[0]?.name ?? "",
    more: others > 0 ? `+${toArabicDigits(others)}` : "",
    topic: topicLabel(item.topic),
    time: relativeTimeAr(item.publishedAt, new Date(ctx.now)),
    timeShort: relativeTimeArShort(item.publishedAt, new Date(ctx.now)),
    draft: ctx.drafts.has(item.id),
    arrive: ctx.arrived.has(item.id),
  };
}
