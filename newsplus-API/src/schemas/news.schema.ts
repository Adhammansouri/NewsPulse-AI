import { z } from "zod";

export const newsFeedQuerySchema = z.object({
  source: z.string().trim().max(40).optional(),
  q: z.string().trim().max(120).optional(),
});

export const newsStoryFormatSchema = z.enum(["desk", "bulletin", "facts", "context", "social"]);

export const newsSummarizeBodySchema = z
  .object({
    input: z.string().trim().max(8_000).optional(),
    itemId: z.string().trim().min(4).max(64).optional(),
    briefing: z.boolean().optional(),
    format: newsStoryFormatSchema.optional(),
    language: z.enum(["ar", "en"]).optional(),
  })
  .refine((value) => Boolean(value.input || value.itemId || value.briefing), {
    message: "invalid-request",
  });

export type NewsFeedQuery = z.infer<typeof newsFeedQuerySchema>;
export type NewsSummarizeBody = z.infer<typeof newsSummarizeBodySchema>;
