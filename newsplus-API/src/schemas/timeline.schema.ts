import { z } from "zod";

/** S14 `GET /news/items/:id/timeline` — a feed item id (same bounds as `itemId` in `/news/summarize`). */
export const timelineParamsSchema = z.object({
  id: z.string().trim().min(4).max(64),
});

/**
 * `?analyze=0`: the entries, counts and any cached analysis, never a model call (the story tab's «تطور القصة · ٤»
 * and «مؤكد من …»). Default: the full analysis (the timeline tab), calling the model for a new snapshot.
 */
export const timelineQuerySchema = z.object({
  analyze: z.enum(["0", "1"]).optional(),
});

export type TimelineParams = z.infer<typeof timelineParamsSchema>;
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
