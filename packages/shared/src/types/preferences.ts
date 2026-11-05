import type { EditorialPublishPlatform } from "./workflow.js";

/** S16 «علّم المحرّر أسلوبك»: the three hook styles of onboarding step 3 (مباشر · سؤال · رقم). */
export const HOOK_STYLES = ["direct", "question", "number"] as const;
export type HookStyle = (typeof HOOK_STYLES)[number];

/** `GET /me/preferences` (and the answer of `PUT`): the signed-in editor's onboarding choices. */
export type UserPreferences = {
  /** Where the editor publishes (step 1): the publish screen's platform tabs open in this order. */
  platforms: EditorialPublishPlatform[];
  /** Source ids the editor follows (step 2): the wire's default source filter. Empty = every source. */
  sources: string[];
  /** The hook style picked in step 3. */
  hookStyle?: HookStyle;
  /** When onboarding was finished or skipped. While it is empty, onboarding shows once after login. */
  onboardedAt?: string;
};

/**
 * `PUT /me/preferences`. Fields left out keep their stored value. `onboarded: true` stamps `onboardedAt` the first
 * time («تخطّي» sends only that). `sources` must be ids `GET /news/sources` lists.
 */
export type UserPreferencesUpdateRequest = {
  platforms?: EditorialPublishPlatform[];
  sources?: string[];
  hookStyle?: HookStyle;
  onboarded?: true;
};

/** `POST /news/hook-styles`: one feed story (onboarding's example, the newest headline). */
export type HookStylesRequest = {
  itemId: string;
};

/** The story's headline as a hook in each style. */
export type HookStylesData = Record<HookStyle, string>;
