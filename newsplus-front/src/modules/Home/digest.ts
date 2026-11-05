// «اللي فاتك» (S13 §3): when the home shows it, and its copy. UI copy is verbatim from
// docs/redesign/design/reference/NewDigest.dc.html and MobNewDigest.dc.html; values in braces are real data.
import type { NewsDigestData, NewsFeedItem } from "@newsplus/shared";
import { wordCount } from "@/modules/Generate/generateDesk";
import { HEADLINES, NEW_HEADLINES } from "@/modules/News/wire/copy";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";
import { SOURCE_COUNT } from "./homeModel";

const HOUR_MS = 60 * 60 * 1000;
/** The digest shows when the previous visit was at least 6 hours ago… */
export const DIGEST_GAP_MS = 6 * HOUR_MS;
/** …or, on a new day, between 05:00 and 11:00 local time. */
export const MORNING_FROM_HOUR = 5;
export const MORNING_TO_HOUR = 11;
/** The API caches a digest 10 minutes per `since` hour; the home keeps it as long. */
export const DIGEST_STALE_MS = 10 * 60 * 1000;
/** Arabic reading speed, as the Generate desk counts «دقائق قراءة». */
const ARABIC_WORDS_PER_MINUTE = 180;

const SECONDS: CountForms = { one: "ثانية", two: "ثانيتين", few: "{n} ثوانٍ", many: "{n} ثانية" };

export const DIGEST_COPY = {
  mobTitle: "اللي فاتك بالليل",
  refresh: "حدّث",
  writeAbout: "اكتب عنه",
  toBriefing: "حوّله لموجز صباحي",
  mobToBriefing: "موجز صباحي",
  copySummary: "انسخ الملخص",
  trendsTitle: "الموضوعات الصاعدة",
  trendsFrom: "من العناوين عندك",
  mobTrendsTitle: "صاعد دلوقتي",
  mobTrendsSpan: "آخر ٣ ساعات",
  breakingNow: "عاجل الآن",
  breakingMode: "وضع العاجل",
  mobBreakingMode: "افتح وضع العاجل",
} as const;

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The previous visit the digest covers, or null when the visit rule does not hold (or there was no visit). */
export function digestSince(lastVisit: number | null, now: Date): number | null {
  if (lastVisit === null || lastVisit > now.getTime()) return null;
  if (now.getTime() - lastVisit >= DIGEST_GAP_MS) return lastVisit;
  const hour = now.getHours();
  const morning = hour >= MORNING_FROM_HOUR && hour < MORNING_TO_HOUR;
  return morning && !sameLocalDay(new Date(lastVisit), now) ? lastVisit : null;
}

/** «١١ م», «٧ ص» — the hour on a 12-hour clock. */
export function hourAr(d: Date): string {
  const h24 = d.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${toArabicDigits(h12)} ${h24 < 12 ? "ص" : "م"}`;
}

/** NewDigest: «اللي فاتك من ١١ م لـ ٧ ص». */
export function digestTitle(since: number, now: Date): string {
  return `اللي فاتك من ${hourAr(new Date(since))} لـ ${hourAr(now)}`;
}

/** Seconds to read the summary. */
export function readSeconds(summaryText: string): number {
  return Math.max(1, Math.round((wordCount(summaryText) * 60) / ARABIC_WORDS_PER_MINUTE));
}

/** NewDigest: «لخّصه المحرّر من ١٤ عنوان · تقرأه في ٤٠ ثانية». */
export function digestMeta(data: NewsDigestData): string {
  return `لخّصه المحرّر من ${countPhrase(data.sourceCount, HEADLINES)} · تقرأه في ${countPhrase(readSeconds(data.summaryText), SECONDS)}`;
}

/** MobNewDigest: «من ١٤ عنوان · ٤٠ ثانية قراءة». */
export function mobDigestMeta(data: NewsDigestData): string {
  return `من ${countPhrase(data.sourceCount, HEADLINES)} · ${countPhrase(readSeconds(data.summaryText), SECONDS)} قراءة`;
}

/** NewDigest header: «١٤ عنوان جديد من امبارح بالليل»; null when nothing arrived. */
export function digestLiveLine(data: NewsDigestData): string | null {
  return data.sourceCount > 0 ? `${countPhrase(data.sourceCount, NEW_HEADLINES)} من امبارح بالليل` : null;
}

export type DigestRow = {
  itemId: string;
  /** «١». */
  number: string;
  title: string;
  /** Desktop: «٤ مصادر · الأهم اقتصادياً». */
  meta: string;
  /** Mobile: «٤ مصادر». */
  sources: string;
};

/** The digest's stories with their source counts from the feed (a story gone from the feed shows its reason only). */
export function digestRows(data: NewsDigestData, items: readonly NewsFeedItem[]): DigestRow[] {
  return data.items.map((entry, index) => {
    const item = items.find((candidate) => candidate.id === entry.itemId);
    const sources = item && item.sources.length > 0 ? countPhrase(item.sources.length, SOURCE_COUNT) : "";
    return {
      itemId: entry.itemId,
      number: toArabicDigits(index + 1),
      title: entry.title,
      meta: [sources, entry.reason].filter(Boolean).join(" · "),
      sources,
    };
  });
}
