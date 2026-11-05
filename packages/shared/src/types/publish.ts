import type { EditorialPublishPlatform } from "./workflow.js";

/** S12 `POST /editorial/conversations/:id/check`. Without `platform`, no platform-length check is made. */
export type PublishCheckRequest = {
  platform?: EditorialPublishPlatform;
};

export type PublishCheckStatus = "ok" | "warn" | "fail";

/** One row of «فحص قبل النشر». `fix.instruction` is sent as is to `POST …/revise`. */
export type PublishCheck = {
  id: string;
  status: PublishCheckStatus;
  title: string;
  note: string;
  fix?: { label: string; instruction: string };
};

/** The checks of one version (the API caches them per version, and per platform for the platform-length row). */
export type PublishCheckData = {
  versionId: string;
  checks: PublishCheck[];
};

/** A social draft as the platforms receive it: الخطاف, النص, الوسوم. */
export type PublishParts = {
  hook: string;
  body: string;
  tags: string[];
};

/**
 * Character limit per platform. X and Telegram are the S12 rules (280, 4,096); Instagram, Facebook and TikTok
 * are the platforms' caption limits (they only fill the ring).
 */
export const PUBLISH_PLATFORM_LIMITS: Record<EditorialPublishPlatform, number> = {
  x: 280,
  instagram: 2_200,
  facebook: 63_206,
  telegram: 4_096,
  tiktok: 4_000,
};

/** Instagram shows about this many characters (the first two lines) before «المزيد». */
export const INSTAGRAM_VISIBLE_CHARS = 125;

/** Length as the platforms count it: code points, not UTF-16 units. */
export function publishTextLength(text: string): number {
  return Array.from(text).length;
}

/**
 * The copy for one platform (S12 §2): X = hook + tags (+ body when it fits the limit); Instagram / Facebook =
 * hook ⏎⏎ body ⏎⏎ tags; Telegram = hook ⏎ body; TikTok = hook + tags. Empty parts are left out.
 */
export function composePublishCopy(platform: EditorialPublishPlatform, parts: PublishParts): string {
  const hook = parts.hook.trim();
  const body = parts.body.trim();
  const tags = parts.tags.join(" ").trim();
  const join = (items: string[], separator: string) => items.filter(Boolean).join(separator);
  switch (platform) {
    case "x": {
      const full = join([hook, body, tags], "\n\n");
      return publishTextLength(full) <= PUBLISH_PLATFORM_LIMITS.x ? full : join([hook, tags], "\n\n");
    }
    case "instagram":
    case "facebook":
      return join([hook, body, tags], "\n\n");
    case "telegram":
      return join([hook, body], "\n");
    case "tiktok":
      return join([hook, tags], "\n\n");
  }
}

/** Instagram's text before «المزيد»: the first two lines, at most `INSTAGRAM_VISIBLE_CHARS` characters. */
export function instagramVisibleText(caption: string): string {
  const lines = caption.split("\n").slice(0, 2).join("\n");
  return Array.from(lines).slice(0, INSTAGRAM_VISIBLE_CHARS).join("");
}
