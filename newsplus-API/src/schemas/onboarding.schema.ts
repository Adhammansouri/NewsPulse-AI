import { EDITORIAL_PUBLISH_PLATFORMS, HOOK_STYLES } from "@newsplus/shared";
import { z } from "zod";

/** At most this many followed sources (the aggregator lists about forty). */
export const PREFERENCE_SOURCES_MAX = 64;
/** A source id, as the feed's `?source=` (the service then checks it against the aggregator's list). */
const SOURCE_ID_MAX = 40;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * S16 `PUT /me/preferences`. Every field is optional (left out = kept); at least one is required, and unknown keys
 * (an `onboardedAt` the client made up) are refused. Repeats are dropped, in the order sent.
 */
export const userPreferencesUpdateBodySchema = z
  .object({
    platforms: z
      .array(z.enum(EDITORIAL_PUBLISH_PLATFORMS))
      .max(EDITORIAL_PUBLISH_PLATFORMS.length * 2)
      .transform(unique)
      .optional(),
    sources: z.array(z.string().trim().min(1).max(SOURCE_ID_MAX)).max(PREFERENCE_SOURCES_MAX).transform(unique).optional(),
    hookStyle: z.enum(HOOK_STYLES).optional(),
    onboarded: z.literal(true).optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "invalid-request" });

/** S16 `POST /news/hook-styles`. Same item id rule as `POST /news/summarize`. */
export const hookStylesBodySchema = z.object({
  itemId: z.string().trim().min(4).max(64),
});

export type UserPreferencesUpdateBody = z.infer<typeof userPreferencesUpdateBodySchema>;
export type HookStylesBody = z.infer<typeof hookStylesBodySchema>;
