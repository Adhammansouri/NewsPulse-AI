import { z } from "zod";

/** A `since` up to this far ahead of the server clock is accepted (client clock skew). */
export const DIGEST_SINCE_SKEW_MS = 5 * 60 * 1000;

/** S13 `POST /news/breaking`. Same item id rule as `POST /news/summarize`. */
export const newsBreakingBodySchema = z.object({
  itemId: z.string().trim().min(4).max(64),
});

/** S13 `POST /news/digest`: `since` is the editor's previous visit, an ISO 8601 time not in the future. */
export const newsDigestBodySchema = z.object({
  since: z.iso
    .datetime({ offset: true })
    .refine((value) => Date.parse(value) <= Date.now() + DIGEST_SINCE_SKEW_MS, { message: "invalid-request" }),
});

export type NewsBreakingBody = z.infer<typeof newsBreakingBodySchema>;
export type NewsDigestBody = z.infer<typeof newsDigestBodySchema>;
