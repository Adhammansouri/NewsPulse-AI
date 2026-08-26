import { z } from "zod";

export const generateBodySchema = z.object({
  prompt: z.string().trim().min(3).max(12_000),
  style: z.enum(["brief", "article", "report"]),
  language: z.enum(["ar", "en"]),
  angle: z.string().trim().max(240).optional(),
});

export type GenerateBody = z.infer<typeof generateBodySchema>;
