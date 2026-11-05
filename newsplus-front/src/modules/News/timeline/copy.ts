// UI copy of the S14 timeline boards (NewTimeline, MobNewTimeline), verbatim. Values in braces come from real data.
import type { TimelineTag } from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";
import { SOURCES } from "../studio/formats";

const UPDATES: CountForms = { one: "تحديث واحد", two: "تحديثين", few: "{n} تحديثات", many: "{n} تحديث" };
const MINUTES: CountForms = { one: "دقيقة", two: "دقيقتين", few: "{n} دقائق", many: "{n} دقيقة" };
/** The ai-panel's «من ٥ دقايق» (the board's Egyptian plural). */
const MINUTES_SINCE: CountForms = { one: "دقيقة", two: "دقيقتين", few: "{n} دقايق", many: "{n} دقيقة" };
const HOURS_SINCE: CountForms = { one: "ساعة", two: "ساعتين", few: "{n} ساعات", many: "{n} ساعة" };

export const TIMELINE_COPY = {
  // Story tabs (`seg`) and the confirmation badge
  tabStory: "الخبر",
  tabTimeline: "تطور القصة",
  tabTimelineCount: (n: number) => `تطور القصة · ${toArabicDigits(n)}`,
  tabSources: "المصادر",
  confirmedBy: (n: number) => `مؤكد من ${countPhrase(n, SOURCES)}`,
  confirmedByMob: (n: number) => countPhrase(n, SOURCES),
  /** S05 chip in the story's meta row (Main). */
  storyChip: (n: number) => `تطور القصة · ${countPhrase(n, UPDATES)}`,
  // Timeline panel
  panelLabel: "تطور القصة",
  meta: (updates: number, minutes: number, last: string) =>
    `${countPhrase(updates, UPDATES)} خلال ${countPhrase(minutes, MINUTES)} · آخر تحديث ${last}`,
  metaMob: (updates: number, minutes: number) => `${countPhrase(updates, UPDATES)} في ${countPhrase(minutes, MINUTES)}`,
  live: "مباشر",
  isNew: "جديد",
  // Draft update (ai-panel)
  draftUpdate: (source: string, since: string) => `فيه تحديث جديد من ${source}. المسودة اللي كتبتها من ${since} ممكن تتحدّث بيه.`,
  updateDraft: "حدّث المسودة",
  // Conflict card
  conflictTitle: "المصادر مختلفة في رقم",
  conflictTitleMob: (field: string) => `المصادر مختلفة في رقم ${field}`,
  conflictLead: (field: string, sources: number) => `${field} مش متطابقة بين ${countPhrase(sources, SOURCES)}:`,
  safeWording: (wording: string) => `المحرّر هيكتب «${wording}» لحد ما تختار، عشان ما ينشرش رقم مش مؤكد.`,
  adopt: (value: string) => `اعتمد ${value}`,
  attributeBoth: "اذكر الرقمين بالإسناد",
  // Agreed + CTA
  agreed: "اللي متفق عليه",
  agreedRow: (text: string, sources: number) => `${text} · ${countPhrase(sources, SOURCES)}`,
  writeFullStory: "اكتب من القصة كاملة",
} as const;

/**
 * Tag badges. Desktop (NewTimeline): «أول من نشر», «أضاف رقم …», «أضاف اقتباس», «جديد · رد فعل …»; mobile
 * (MobNewTimeline): «أول من نشر», «أضاف رقم», «اقتباس», «جديد». The board's objects («التضخم», «الأسواق») are sample
 * data the contract does not carry, so the label stops before them. `update` has no label on either board.
 */
const TAG_DESK: Record<TimelineTag, string> = {
  first: "أول من نشر",
  number: "أضاف رقم",
  quote: "أضاف اقتباس",
  reaction: "رد فعل",
  update: "",
};
const TAG_MOB: Record<TimelineTag, string> = {
  first: "أول من نشر",
  number: "أضاف رقم",
  quote: "اقتباس",
  reaction: "رد فعل",
  update: "",
};

/** Desktop badge: «جديد · {tag}» for a new entry; "" = no badge. */
export function tagLabelDesk(tag: TimelineTag, isNew: boolean): string {
  const label = TAG_DESK[tag];
  if (!isNew) return label;
  return label ? `${TIMELINE_COPY.isNew} · ${label}` : TIMELINE_COPY.isNew;
}

/** Mobile meta: «{source} · {tag}», «{source} · جديد» for a new entry, the name alone without a label. */
export function sourceTagMob(source: string, tag: TimelineTag, isNew: boolean): string {
  const label = isNew ? TIMELINE_COPY.isNew : TAG_MOB[tag];
  return label ? `${source} · ${label}` : source;
}

/** «٥ دقايق», «ساعة», «٣ ساعات»: how long ago the draft was written (the ai-panel). */
export function sinceDraft(ms: number): string {
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  if (minutes < 60) return countPhrase(minutes, MINUTES_SINCE);
  return countPhrase(Math.floor(minutes / 60), HOURS_SINCE);
}
