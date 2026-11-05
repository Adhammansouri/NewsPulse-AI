// S12 «جاهز للنشر»: the view model of NewPublish / MobNewPreview / MobNewCheck — the platform copy (S12 §2 copy
// rule, shared with the API), the ring (% of the platform limit, coloured by the S12 thresholds), the frame's
// parts per platform (NewPublish `P[k].showBody` / `.media`), and the summary of the checks.
import {
  composePublishCopy,
  EDITORIAL_PUBLISH_PLATFORMS,
  instagramVisibleText,
  PUBLISH_PLATFORM_LIMITS,
  publishTextLength,
  type EditorialConversationDetail,
  type EditorialPublishPlatform,
  type NewsSummarizeData,
  type PublishCheck,
  type PublishParts,
} from "@newsplus/shared";
import { toArabicDigits } from "@/utils/arabic";
import { socialModel } from "../studio/draft/draftModel";
import { LIMIT_COPY, MOB_INSTAGRAM_LIMIT, PLATFORM_NAME, PUBLISH_COPY, X_NOTE_OUTSIDE_BAND } from "./publishCopy";

export type Platform = EditorialPublishPlatform;

/** NewPublish `order`: X · إنستجرام · فيسبوك · تيليجرام · تيك توك. */
export const PLATFORMS: readonly Platform[] = EDITORIAL_PUBLISH_PLATFORMS;

/** The board opens on X. */
export const DEFAULT_PLATFORM: Platform = "x";

/**
 * S16: the platforms the editor publishes on (onboarding step 1) come first, in the board's order, then the others;
 * without a choice the board's order stays.
 */
export function orderedPlatforms(preferred: readonly Platform[] | undefined): readonly Platform[] {
  if (!preferred || preferred.length === 0) return PLATFORMS;
  return [...PLATFORMS.filter((platform) => preferred.includes(platform)), ...PLATFORMS.filter((platform) => !preferred.includes(platform))];
}

/** The tab a publish screen opens on: the first platform the editor publishes on, else the board's default. */
export function openingPlatform(preferred: readonly Platform[] | undefined, fallback: Platform): Platform {
  return preferred?.length ? orderedPlatforms(preferred)[0] : fallback;
}

/** The publish check and preview exist for the social post (hook / body / hashtags). */
export function publishable(data: NewsSummarizeData | undefined): data is NewsSummarizeData {
  return data?.format === "social";
}

export function publishParts(data: NewsSummarizeData): PublishParts {
  const { hook, body, tags } = socialModel(data);
  return { hook, body, tags };
}

/** «١٬٢٤٨». */
export function arabicCount(n: number): string {
  return toArabicDigits(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));
}

/** S12 ring colour: `--teal-dot` < 85%, `--warn-dot` 85–100%, `--breaking-dot` > 100%. */
export function ringColor(pct: number): string {
  if (pct > 100) return "var(--breaking-dot)";
  if (pct >= 85) return "var(--warn-dot)";
  return "var(--teal-dot)";
}

/** NewPublish `P[k].media`: the platforms whose post carries a picture. */
const MEDIA: Record<Platform, boolean> = { x: false, instagram: true, facebook: true, telegram: false, tiktok: true };

/**
 * NewPublish `P[k].handle` / MobNewPreview: the newsroom's account under «Newsplus» in the frame (never the
 * editor's name). The app has no handle setting yet (S12 «handle from settings»), so the boards' handles stand.
 */
const HANDLE: Record<Platform, string> = {
  x: "@newsplus",
  instagram: "newsplus",
  facebook: "Newsplus",
  telegram: "t.me/newsplus",
  tiktok: "@newsplus",
};

export type PlatformView = {
  platform: Platform;
  name: string;
  /** The newsroom's account on the platform (the frame's second line). */
  handle: string;
  /** What «نسخ لـ…» copies. */
  copy: string;
  count: number;
  /** % of the platform limit (`--p`). */
  pct: number;
  ringColor: string;
  limitTitle: string;
  limitNote: string;
  /** The copy carries the body (X only when it fits; never on TikTok). */
  showBody: boolean;
  media: boolean;
};

export function platformView(platform: Platform, parts: PublishParts, mobile = false): PlatformView {
  const copy = composePublishCopy(platform, parts);
  const count = publishTextLength(copy);
  const pct = Math.round((count / PUBLISH_PLATFORM_LIMITS[platform]) * 100);
  const limit = mobile && platform === "instagram" ? null : LIMIT_COPY[platform];
  const inBand = pct >= 85 && pct <= 100;
  return {
    platform,
    name: PLATFORM_NAME[platform],
    handle: HANDLE[platform],
    copy,
    count,
    pct,
    ringColor: ringColor(pct),
    limitTitle: limit ? limit.title(arabicCount(count)) : MOB_INSTAGRAM_LIMIT.title,
    limitNote: limit ? (platform === "x" && !inBand ? X_NOTE_OUTSIDE_BAND : limit.note) : MOB_INSTAGRAM_LIMIT.note,
    showBody: Boolean(parts.body.trim()) && platform !== "tiktok" && copy.includes(parts.body.trim()),
    media: MEDIA[platform],
  };
}

/** MobNewPreview: Instagram's caption before «المزيد», and whether more follows. */
export function instagramPreview(view: PlatformView): { visible: string; more: boolean } {
  const visible = instagramVisibleText(view.copy).trimEnd();
  return { visible, more: publishTextLength(visible) < view.count };
}

/** The frame's picture: the story's headline (the evidence packet's «Headline:» line), else the draft's hook. */
export function storyHeadline(detail: EditorialConversationDetail | undefined, data: NewsSummarizeData): string {
  const line = detail?.sourcePacket.split("\n").find((entry) => entry.startsWith("Headline: "));
  return line?.slice("Headline: ".length).trim() || data.title;
}

/** The current version's number (ن{n}). */
export function currentVersionNumber(detail: EditorialConversationDetail | undefined, data: NewsSummarizeData): number | null {
  const current = detail?.versions.find((version) => version.id === detail.currentVersionId);
  return current?.number ?? data.versionNumber ?? null;
}

export type CheckSummary = { variant: "warn" | "ok"; text: string; notes: number };

/** The aside's badge: «ملاحظتين · ٤ تمام» / «٦ من ٦ تمام». */
export function checkSummary(checks: PublishCheck[]): CheckSummary {
  const notes = checks.filter((check) => check.status !== "ok").length;
  return notes > 0
    ? { variant: "warn", text: PUBLISH_COPY.summaryWarn(notes, checks.length - notes), notes }
    : { variant: "ok", text: PUBLISH_COPY.summaryOk(checks.length), notes };
}

/** The checks «صلّح» can act on. */
export function fixableChecks(checks: PublishCheck[]): Array<PublishCheck & { fix: NonNullable<PublishCheck["fix"]> }> {
  return checks.filter((check): check is PublishCheck & { fix: NonNullable<PublishCheck["fix"]> } => check.status !== "ok" && Boolean(check.fix));
}

/** «صلّح الملاحظات تلقائياً»: every fix as one instruction to the editor. */
export function fixAllInstruction(checks: PublishCheck[]): string {
  const fixes = fixableChecks(checks).map((check) => check.fix.instruction);
  if (fixes.length <= 1) return fixes[0] ?? "";
  return fixes.map((instruction, index) => `${index + 1}. ${instruction}`).join("\n");
}

/** MobNewPreview's notice: the main issue — the first failure, else the first warning. */
export function mainIssue(checks: PublishCheck[]): PublishCheck | null {
  return checks.find((check) => check.status === "fail") ?? checks.find((check) => check.status === "warn") ?? null;
}
