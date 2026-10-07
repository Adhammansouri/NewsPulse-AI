import type { NewsStoryFormat, NewsSummarizeData, NewsSummaryFormat, NewsTopic } from "@newsplus/shared";
import { NEWS_TOPICS } from "@newsplus/shared";

const SOURCE_TONES = [
  "var(--color-teal-600)",
  "var(--color-navy-700)",
  "var(--color-coral-500)",
  "var(--color-navy-500)",
];

export function sourceTone(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SOURCE_TONES[hash % SOURCE_TONES.length];
}

export function sourceInitial(name: string) {
  const trimmed = name.trim();
  const arabic = trimmed.match(/[\u0600-\u06FF]/);
  if (arabic) return arabic[0];
  const latin = trimmed.match(/[A-Za-z0-9]/);
  return (latin?.[0] ?? trimmed[0] ?? "?").toUpperCase();
}

export function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

export function formatRelative(iso: string) {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

    if (Math.abs(diffMs) < minute) return "الآن";
    if (Math.abs(diffMs) < hour) return rtf.format(-Math.round(diffMs / minute), "minute");
    if (Math.abs(diffMs) < day) return rtf.format(-Math.round(diffMs / hour), "hour");
    if (Math.abs(diffMs) < 7 * day) return rtf.format(-Math.round(diffMs / day), "day");
    return date.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function formatStamp(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export type NewsRecency = "now" | "fresh" | "hour" | "recent" | "aging";

const NOW_MS = 5 * 60 * 1000;
const FRESH_MS = 20 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const RECENT_MS = 3 * 60 * 60 * 1000;

export function newsRecency(iso: string): NewsRecency {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "aging";
  if (diff < NOW_MS) return "now";
  if (diff < FRESH_MS) return "fresh";
  if (diff < HOUR_MS) return "hour";
  if (diff < RECENT_MS) return "recent";
  return "aging";
}

export type TimeFilter = "all" | "fresh" | "hour" | "three" | "today";

export const TIME_FILTERS: Array<{ id: TimeFilter; label: string; hint: string }> = [
  { id: "all", label: "الكل", hint: "كل الأوقات" },
  { id: "fresh", label: "جديد", hint: "آخر 20 دقيقة" },
  { id: "hour", label: "ساعة", hint: "آخر ساعة" },
  { id: "three", label: "3 ساعات", hint: "آخر ثلاث ساعات" },
  { id: "today", label: "اليوم", hint: "منذ منتصف الليل" },
];

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

export function timeFilterCounts(items: Array<{ publishedAt: string }>) {
  const counts: Record<TimeFilter, number> = {
    all: items.length,
    fresh: 0,
    hour: 0,
    three: 0,
    today: 0,
  };
  for (const item of items) {
    if (matchesTimeFilter(item.publishedAt, "fresh")) counts.fresh += 1;
    if (matchesTimeFilter(item.publishedAt, "hour")) counts.hour += 1;
    if (matchesTimeFilter(item.publishedAt, "three")) counts.three += 1;
    if (matchesTimeFilter(item.publishedAt, "today")) counts.today += 1;
  }
  return counts;
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

export function topicFilterCounts(items: Array<{ topic?: NewsTopic }>) {
  const counts: Record<TopicFilter, number> = {
    all: items.length,
    politics: 0,
    economy: 0,
    health: 0,
    sports: 0,
    tech: 0,
    science: 0,
    culture: 0,
    other: 0,
  };
  for (const item of items) {
    const topic = item.topic && NEWS_TOPICS.includes(item.topic) ? item.topic : "other";
    counts[topic] += 1;
  }
  return counts;
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


