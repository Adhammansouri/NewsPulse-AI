// The draft's blocks, read from the existing `NewsSummarizeData` fields only (S06 §4) — no API change:
// - social: title = الخطاف, summary = النص, bullets = hashtags (الوسوم) then alternate hooks (newsplus-API social spec);
// - video: title = عنوان النشر, dek = الكوفر, summary = النص whose first beat is the hook (the spec's first 3–5
//   seconds, before the first «<<<<<<» line or blank line), bullets = لقطات / CG;
// - desk / bulletin / facts / context: title, dek (المقدمة), summary (النص), bullets (the points);
// - briefing: title + one line per story (bullets; the numbered summary paragraphs when there are none);
// - carousel: summary = الكابشن, bullets = hashtags, `carousel.slides`.
// `blockTexts` lists every block's text so two versions can be compared (`is-changed`).
import type { EditorialConversationDetail, NewsSummarizeData, NewsSummaryFormat } from "@newsplus/shared";
import { hasArabic, splitSocialBullets } from "../../newsFormat";

export type TextDir = "rtl" | "ltr";

export function textDir(text: string): TextDir {
  return hasArabic(text) ? "rtl" : "ltr";
}

/** The draft's own direction (English copy is LTR, as `story.dir` on the boards). */
export function draftDir(data: NewsSummarizeData): TextDir {
  return data.language === "en" ? "ltr" : "rtl";
}

export type SocialModel = { hook: string; body: string; tags: string[]; alts: string[] };

export function socialModel(data: NewsSummarizeData): SocialModel {
  const { tags, alts } = splitSocialBullets(data.bullets);
  return { hook: data.title, body: data.summary, tags, alts };
}

const BEAT_LINE = /^\s*<{3,}\s*$/;

/** The script's first beat (the hook) and the rest; a one-beat script has no separate hook. */
export function videoScript(summary: string): { hook: string | null; script: string } {
  const text = summary.trim();
  const lines = text.split("\n");
  const beat = lines.findIndex((line) => BEAT_LINE.test(line));
  if (beat > 0) {
    const hook = lines.slice(0, beat).join("\n").trim();
    const script = lines.slice(beat + 1).join("\n").trim();
    if (hook && script) return { hook, script };
  }
  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    return { hook: paragraphs[0].trim(), script: paragraphs.slice(1).join("\n\n").trim() };
  }
  return { hook: null, script: text };
}

export type VideoModel = { title: string; cover: string; hook: string | null; script: string; shots: string[] };

export function videoModel(data: NewsSummarizeData): VideoModel {
  const { hook, script } = videoScript(data.summary);
  return { title: data.title, cover: data.dek, hook, script, shots: data.bullets.filter((line) => line.trim()) };
}

export const DOC_FORMATS: readonly NewsSummaryFormat[] = ["desk", "bulletin", "facts", "context"];

/** Main `doc`: which blocks each web format shows. */
export function docShape(format: NewsSummaryFormat) {
  return {
    dek: format !== "bulletin" && format !== "facts",
    body: format !== "facts",
    points: format === "facts" || format === "desk" || format === "context",
  };
}

const NUMBERED = /^\s*(\d+)[.)-]\s+/;

/** The briefing's stories: one line each (bullets), or the numbered paragraphs of the summary. */
export function briefingItems(data: NewsSummarizeData): string[] {
  const lines = data.bullets.map((line) => line.trim()).filter(Boolean);
  if (lines.length > 0) return lines.map((line) => line.replace(NUMBERED, ""));
  return data.summary
    .split(/\n\s*\n|\n(?=\s*\d+[.)-]\s)/)
    .map((paragraph) => paragraph.trim().replace(NUMBERED, ""))
    .filter(Boolean);
}

/** Carousel hashtags (bullets), each with its «#». */
export function carouselTags(data: NewsSummarizeData): string[] {
  return data.bullets
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") || item.startsWith("＃") ? item : `#${item.replace(/\s+/g, "")}`));
}

export type BlockKey =
  | "hook"
  | "body"
  | "tags"
  | "alts"
  | "title"
  | "cover"
  | "videoHook"
  | "script"
  | "shots"
  | "dek"
  | "points"
  | "items"
  | "caption";

/** Every block's text, per format, so two versions can be compared. */
export function blockTexts(data: NewsSummarizeData): Partial<Record<BlockKey, string>> {
  switch (data.format) {
    case "social": {
      const social = socialModel(data);
      return { hook: social.hook, body: social.body, tags: social.tags.join(" "), alts: social.alts.join("\n") };
    }
    case "video": {
      const video = videoModel(data);
      return { title: video.title, cover: video.cover, videoHook: video.hook ?? "", script: video.script, shots: video.shots.join("\n") };
    }
    case "briefing":
      return { title: data.title, items: briefingItems(data).join("\n") };
    case "carousel":
      return { caption: data.summary, tags: carouselTags(data).join(" ") };
    default:
      return { title: data.title, dek: data.dek, body: data.summary, points: data.bullets.join("\n") };
  }
}

export type Revision = {
  /** The current version's number (ن{n}), when the conversation is loaded. */
  number: number | null;
  /** Blocks whose text differs from the previous version's copy. */
  changed: ReadonlySet<BlockKey>;
  /** The previous version's copy (the briefing compares its lines one by one). */
  previous: NewsSummarizeData | null;
};

const NO_CHANGES: Revision = { number: null, changed: new Set(), previous: null };

/** S06 §3 `is-changed`: compares the current version's copy with the previous version's. */
export function revision(detail: EditorialConversationDetail | undefined, data: NewsSummarizeData): Revision {
  if (!detail) return NO_CHANGES;
  const current = detail.versions.find((version) => version.id === detail.currentVersionId);
  if (!current) return NO_CHANGES;
  const previous = detail.versions.find((version) => version.number === current.number - 1);
  if (!previous?.copy) return { number: current.number, changed: new Set(), previous: null };
  const before = blockTexts(previous.copy);
  const after = blockTexts(data);
  const changed = new Set<BlockKey>();
  for (const key of Object.keys(after) as BlockKey[]) {
    if ((before[key] ?? "") !== (after[key] ?? "")) changed.add(key);
  }
  return { number: current.number, changed, previous: previous.copy };
}
