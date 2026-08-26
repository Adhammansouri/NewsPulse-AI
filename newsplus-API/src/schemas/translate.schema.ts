import { z } from "zod";

export const translateBodySchema = z
  .object({
    text: z.string().trim().max(20_000).optional(),
    url: z.string().trim().max(2_000).optional(),
    target: z.enum(["ar", "en"]),
  })
  .refine((value) => Boolean(value.text || value.url), {
    message: "invalid-request",
  });

export type TranslateBody = z.infer<typeof translateBodySchema>;
