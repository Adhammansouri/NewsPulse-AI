import type { NewsStoryFormat, NewsSummarizeData, NewsSummaryFormat, NewsTopic } from "@newsplus/shared";
import { NEWS_TOPICS } from "@newsplus/shared";

/**
 * The outlets the boards draw, in the boards' colours (Main, MobWire, MobFilters, MobOnboard, NewTimeline: every
 * `mark` of an outlet has the same background on every board). Keyed by the API's source ids (newsSources.ts).
 */
const BOARD_SOURCE_TONES: Record<string, string> = {
  alarabiya: "#0f6e5d",
  "sky-arabia": "#1d4ed8",
  asharq: "#c2410c",
  reuters: "#c2410c",
  "bbc-ar": "#b91c1c",
  "bbc-world": "#7f1d1d",
  "aljazeera-ar": "#a16207",
  "al-ain": "#6d28d9",
  ap: "#334155",
};

/** Any other outlet: one of the boards' mark colours, picked from its id (the API sends no colour). */
const SOURCE_TONES = ["#0f6e5d", "#1d4ed8", "#c2410c", "#b91c1c", "#a16207", "#6d28d9", "#334155", "#7f1d1d"];

/** A source's mark colour: the boards' colour for the outlets they draw, else stable per source id. */
export function sourceTone(id: string) {
  const board = BOARD_SOURCE_TONES[id];
  if (board) return board;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SOURCE_TONES[hash % SOURCE_TONES.length];
}

export function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

const FRESH_MS = 20 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const RECENT_MS = 3 * 60 * 60 * 1000;

export type TimeFilter = "all" | "fresh" | "hour" | "three" | "today";

/** The wire's time segments (Main / MobFilters `seg seg--block`), widest last but «الكل» first. */
export const TIME_FILTERS: Array<{ id: TimeFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "fresh", label: "٢٠ د" },
  { id: "hour", label: "ساعة" },
  { id: "three", label: "٣ س" },
  { id: "today", label: "اليوم" },
];

/** Wire row freshness (np4 `wire-row` / npm2 `m-row` modifiers): < 20 min `is-now`, < 60 min `is-hour`, older none. */
export type WireFreshness = "is-breaking" | "is-now" | "is-hour" | "";

/** Main board: `is-breaking` only for breaking items that are still fresh (< 20 min), then `is-now` / `is-hour`. */
export function wireFreshness(iso: string, breaking: boolean, now = Date.now()): WireFreshness {
  const time = publishedAt(iso);
  if (time == null) return "";
  const age = now - time;
  if (age < FRESH_MS) return breaking ? "is-breaking" : "is-now";
  if (age < HOUR_MS) return "is-hour";
  return "";
}

function publishedAt(iso: string) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : null;
}

export function matchesTimeFilter(iso: string, filter: TimeFilter) {
  if (filter === "all") return true;
  const time = publishedAt(iso);
  if (time == null) return false;
  const age = Date.now() - time;
  if (filter === "fresh") return age < FRESH_MS;
  if (filter === "hour") return age < HOUR_MS;
  if (filter === "three") return age < RECENT_MS;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return time >= start.getTime();
}

export type TopicFilter = "all" | NewsTopic;

export const TOPIC_FILTERS: Array<{ id: TopicFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "politics", label: "سياسة" },
  { id: "economy", label: "اقتصاد" },
  { id: "health", label: "صحة" },
  { id: "sports", label: "رياضة" },
  { id: "tech", label: "تكنولوجيا" },
  { id: "science", label: "علوم" },
  { id: "culture", label: "ثقافة" },
  { id: "other", label: "أخرى" },
];

export function matchesTopicFilter(topic: NewsTopic | undefined, filter: TopicFilter) {
  if (filter === "all") return true;
  const resolved = topic && NEWS_TOPICS.includes(topic) ? topic : "other";
  return resolved === filter;
}

export const STORY_FORMATS: {
  id: NewsStoryFormat;
  label: string;
  hint: string;
  ready: string;
}[] = [
  { id: "desk", label: "مكتبي", hint: "هرم مقلوب · 90–140 كلمة", ready: "ملخص مكتبي" },
  { id: "bulletin", label: "نشرة", hint: "فقرة واحدة للشريط", ready: "نشرة جاهزة" },
  { id: "facts", label: "حقائق", hint: "أرقام وأسماء للإسناد", ready: "ملف حقائق" },
  { id: "context", label: "سياق", hint: "لماذا يهم الآن", ready: "سياق الخبر" },
  { id: "social", label: "سوشيال", hint: "ملخص سوشيال ميديا · 40–70 كلمة", ready: "منشور سوشيال" },
  { id: "video", label: "فيديو", hint: "سكريبت فيديو اجتماعي · هوك وحبكة", ready: "سكريبت فيديو" },
  { id: "carousel", label: "كاروسيل", hint: "نصوص الشرائح · تتحط على الصورة", ready: "نصوص الكاروسيل" },
];

export function splitSocialBullets(bullets: string[]) {
  const tags: string[] = [];
  const alts: string[] = [];
  for (const item of bullets) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith("＃")) {
      for (const part of trimmed.split(/\s+/)) {
        if (part.startsWith("#") || part.startsWith("＃")) tags.push(part);
      }
    } else {
      alts.push(trimmed);
    }
  }
  return { tags, alts };
}

export function formatSummaryClipboard(data: NewsSummarizeData) {
  if (data.format === "social") {
    const { tags } = splitSocialBullets(data.bullets);
    return [data.title, data.summary, tags.join(" ")].filter(Boolean).join("\n\n");
  }
  if (data.format === "carousel") {
    const tags = data.bullets
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.startsWith("#") || item.startsWith("＃") ? item : `#${item.replace(/\s+/g, "")}`));
    const slides = (data.carousel?.slides ?? [])
      .map((slide, index) =>
        [`شريحة ${index + 1}`, slide.headline, slide.banner, slide.attribution].filter(Boolean).join("\n"),
      )
      .join("\n\n");
    return [slides, data.summary, tags.join(" ")].filter(Boolean).join("\n\n");
  }
  if (data.format === "video") {
    const shots = data.bullets.filter(Boolean);
    return [
      `عنوان النشر\n${data.title}`,
      data.dek ? `الكوفر\n${data.dek}` : "",
      data.summary ? `النص\n${data.summary}` : "",
      shots.length ? `لقطات\n${shots.map((item) => `• ${item}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  const meta = storyFormatMeta(data.format);
  const lines =
    data.format === "facts"
      ? [data.title, data.dek, ...data.bullets.map((item) => `• ${item}`)]
      : data.format === "bulletin"
        ? [data.title, data.dek, data.summary]
        : [data.title, data.dek, data.summary, ...data.bullets.map((item) => `• ${item}`)];
  return [meta.ready, ...lines.filter(Boolean)].join("\n\n");
}

export function storyFormatMeta(format: NewsSummaryFormat) {
  if (format === "briefing") {
    return { id: "briefing" as const, label: "موجز", hint: "أعلى 8 عناوين في الغرفة", ready: "موجز الغرفة" };
  }
  return STORY_FORMATS.find((item) => item.id === format) ?? STORY_FORMATS[0];
}


