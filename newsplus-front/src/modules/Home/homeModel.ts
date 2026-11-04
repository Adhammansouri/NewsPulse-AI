// View model of the home «مكتب اليوم» (S07): header lines, «كمّل شغلك», «أهم العناوين الآن», the breaking
// strip and «شغلك النهارده». UI copy is verbatim from docs/redesign/design/reference/DeskHome.dc.html and
// MobHome.dc.html; every value in it comes from real data.
import type { EditorialConversationSummary, NewsFeedItem, NewsSummaryFormat } from "@newsplus/shared";
import { STYLE_LABEL, type GenerateDraft } from "@/modules/Generate/generateDesk";
import { NEW_HEADLINES } from "@/modules/News/wire/copy";
import type { SourceLanguages } from "@/modules/News/wire/filters";
import { toRowModel, type WireRowModel } from "@/modules/News/wire/rows";
import type { DeskHandoffState } from "@/services/deskHandoff";
import type { DailyStats } from "@/services/dailyStats";
import { clockAr, countPhrase, relativeTimeAr, toArabicDigits, type CountForms } from "@/utils/arabic";

/** The archive (S06: the MobArchive screen, the studio's drawer from 1024px) and its «ذاكرة الفريق» tab. */
export const ARCHIVE_PATH = "/archive";
export const ARCHIVE_MEMORY_PATH = "/archive?tab=memory";

/** «كمّل شغلك» rows (DeskHome `drafts`). */
export const RESUME_MAX = 4;
/** «أهم العناوين الآن»: 4 `wire-row`s on DeskHome, 3 `m-row`s on MobHome. */
export const TOP_ROWS_DESK = 4;
export const TOP_ROWS_MOB = 3;

const SOURCE_COUNT: CountForms = { one: "مصدر واحد", two: "مصدرين", few: "{n} مصادر", many: "{n} مصدر" };

/** «ذاكرة الفريق · ٤ قواعد مفعّلة» (same forms as MorePage). */
const ACTIVE_RULES: CountForms = {
  one: "قاعدة واحدة مفعّلة",
  two: "قاعدتين مفعّلتين",
  few: "{n} قواعد مفعّلة",
  many: "{n} قاعدة مفعّلة",
};

/**
 * A format as the home and archive boards name it: `kind` in the desktop `ic-wrap`, `name` in the meta line
 * (desktop) and the badge (mobile). DeskHome / DeskArchive name video, social, carousel, briefing, desk and
 * facts; bulletin and context take their studio tile names (Main) — not drawn on these boards.
 */
const FORMAT_LABEL: Record<NewsSummaryFormat, { kind: string; name: string }> = {
  video: { kind: "فيديو", name: "سكريبت فيديو" },
  social: { kind: "سوشيال", name: "منشور سوشيال" },
  carousel: { kind: "شرائح", name: "كاروسيل" },
  briefing: { kind: "موجز", name: "موجز الساعة" },
  desk: { kind: "خبر", name: "خبر مكتبي" },
  facts: { kind: "حقائق", name: "ملف حقائق" },
  bulletin: { kind: "نشرة", name: "نشرة" },
  context: { kind: "سياق", name: "سياق الخبر" },
};

/** The source of a Generate draft in its meta line: «مقال · توليد · قبل ساعتين». */
const GENERATE_ORIGIN = "توليد";

export type ResumeItem = {
  key: string;
  /** Desktop `ic-wrap` text: «فيديو». */
  kind: string;
  /** Mobile badge: «سكريبت فيديو». */
  name: string;
  /** `ic-wrap--ai` for the most recent, `ic-wrap--teal` for a conversation, plain for a Generate draft. */
  icon: "ic-wrap--ai" | "ic-wrap--teal" | "";
  title: string;
  /** Desktop: «سكريبت فيديو · ن٣ · قبل ٤ دقائق». */
  meta: string;
  /** Mobile `vchip`: «ن٣» (none for a Generate draft). */
  version: string | null;
  /** «قبل ٤ دقائق». */
  time: string;
  to: string;
  state?: DeskHandoffState;
};

function timeOf(iso: string): number {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? at : 0;
}

function relativeAt(at: number, now: Date): string {
  return at > 0 ? relativeTimeAr(new Date(at).toISOString(), now) : "";
}

/** The last editorial conversations and the latest Generate draft, newest first, at most `RESUME_MAX`. */
export function resumeItems(
  conversations: readonly EditorialConversationSummary[],
  draft: GenerateDraft | null,
  now: Date,
): ResumeItem[] {
  const entries: Array<ResumeItem & { at: number }> = conversations.slice(0, RESUME_MAX).map((c) => {
    const at = timeOf(c.updatedAt);
    const time = relativeAt(at, now);
    const label = FORMAT_LABEL[c.format] ?? FORMAT_LABEL.desk;
    const version = `ن${toArabicDigits(c.versionCount)}`;
    return {
      at,
      key: `c-${c.id}`,
      kind: label.kind,
      name: label.name,
      icon: "ic-wrap--teal",
      title: c.title,
      meta: [label.name, version, time].filter(Boolean).join(" · "),
      version,
      time,
      to: "/news",
      state: { conversationId: c.id },
    };
  });
  if (draft) {
    const time = relativeAt(draft.at, now);
    const style = STYLE_LABEL[draft.style];
    entries.push({
      at: draft.at,
      key: `g-${draft.id}`,
      kind: style,
      name: style,
      icon: "",
      title: draft.title,
      meta: [style, GENERATE_ORIGIN, time].filter(Boolean).join(" · "),
      version: null,
      time,
      to: "/generate",
    });
  }
  return entries
    .sort((a, b) => b.at - a.at)
    .slice(0, RESUME_MAX)
    .map(({ at: _at, ...item }, index) => (index === 0 ? { ...item, icon: "ic-wrap--ai" } : item));
}

/* ---------- Header ---------- */

const WEEKDAY = new Intl.DateTimeFormat("ar-EG", { weekday: "long" });
const DAY_MONTH = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long" });

/** «الثلاثاء ٣ نوفمبر» (MobHome); DeskHome adds the clock: «الثلاثاء ٣ نوفمبر · ٣:٠٤ م». */
export function dateLine(now: Date, withClock: boolean): string {
  const day = toArabicDigits(`${WEEKDAY.format(now)} ${DAY_MONTH.format(now)}`);
  return withClock ? `${day} · ${clockAr(now)}` : day;
}

/** «صباح الخير، سارة» before noon, «مساء الخير، سارة» from noon. */
export function greeting(now: Date, displayName: string): string {
  const salute = now.getHours() < 12 ? "صباح الخير" : "مساء الخير";
  const name = displayName.trim();
  return name ? `${salute}، ${name}` : salute;
}

/** «٨ عناوين جديدة منذ آخر زيارة»; null when nothing arrived since the last visit (or there was none). */
export function liveLine(items: readonly NewsFeedItem[], lastVisit: number | null): string | null {
  if (lastVisit === null) return null;
  const count = items.filter((item) => timeOf(item.publishedAt) > lastVisit).length;
  return count > 0 ? `${countPhrase(count, NEW_HEADLINES)} منذ آخر زيارة` : null;
}

/* ---------- Headlines + breaking strip ---------- */

/** Row direction is not used here (the DeskHome rows set no `dir`), so the source languages are not loaded. */
const NO_LANGUAGES: SourceLanguages = new Map();
const NO_IDS: ReadonlySet<string> = new Set();

export type HomeRow = Pick<WireRowModel, "id" | "title" | "freshness"> & {
  /** «الجزيرة نت +١». */
  source: string;
  /** «قبل ١١ د». */
  time: string;
};

export type BreakingStory = { id: string; title: string; meta: string };

function rowOf(item: NewsFeedItem, now: number): WireRowModel {
  return toRowModel(item, { languages: NO_LANGUAGES, drafts: NO_IDS, arrived: NO_IDS, now });
}

/**
 * The breaking strip: the newest breaking item still inside the wire's breaking window (20 minutes —
 * the rows' `is-breaking`). «قبل ٣ دقائق · ٣ مصادر».
 */
export function breakingStory(items: readonly NewsFeedItem[], now: number): BreakingStory | null {
  let found: NewsFeedItem | null = null;
  for (const item of items) {
    if (rowOf(item, now).freshness !== "is-breaking") continue;
    if (!found || timeOf(item.publishedAt) > timeOf(found.publishedAt)) found = item;
  }
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    meta: `${relativeTimeAr(found.publishedAt, new Date(now))} · ${countPhrase(found.sources.length, SOURCE_COUNT)}`,
  };
}

/** The top of the wire, without the story already in the breaking strip. */
export function topRows(items: readonly NewsFeedItem[], now: number, skipId: string | null, max: number): HomeRow[] {
  return items
    .filter((item) => item.id !== skipId)
    .slice(0, max)
    .map((item) => {
      const row = rowOf(item, now);
      return {
        id: row.id,
        title: row.title,
        freshness: row.freshness,
        source: row.more ? `${row.source} ${row.more}` : row.source,
        time: row.timeShort,
      };
    });
}

/** How the S04 wire opens a story: the newsroom with `?item=` (mobile goes on to the story screen). */
export function storyLink(itemId: string): string {
  return `/news?item=${encodeURIComponent(itemId)}`;
}

/* ---------- «شغلك النهارده» + memory card ---------- */

export type TodayStat = { label: string; value: string };

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** مسودات = conversations created today · تعديل بالمحرّر = Σ(versionCount − 1) of those · the two daily counters. */
export function todayStats(
  conversations: readonly EditorialConversationSummary[],
  daily: DailyStats,
  now: Date,
): TodayStat[] {
  const today = conversations.filter((c) => sameLocalDay(new Date(c.createdAt), now));
  const edits = today.reduce((sum, c) => sum + Math.max(0, c.versionCount - 1), 0);
  return [
    { label: "مسودات", value: toArabicDigits(today.length) },
    { label: "تعديل بالمحرّر", value: toArabicDigits(edits) },
    { label: "ترجمات", value: toArabicDigits(daily.translations) },
    { label: "شرائح مرسومة", value: toArabicDigits(daily.slides) },
  ];
}

export type MemoryCard = { rule: string; count: string };

/** The newest approved rule + «٤ قواعد مفعّلة»; null without rules (the card is hidden). */
export function memoryCard(rules: ReadonlyArray<{ instruction: string; updatedAt: string }>): MemoryCard | null {
  if (rules.length === 0) return null;
  const newest = rules.reduce((best, rule) => (timeOf(rule.updatedAt) > timeOf(best.updatedAt) ? rule : best));
  return { rule: newest.instruction, count: countPhrase(rules.length, ACTIVE_RULES) };
}
