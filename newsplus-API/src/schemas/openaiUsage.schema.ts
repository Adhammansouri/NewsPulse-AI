import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const openaiUsageQuerySchema = z.object({
  start: date,
  end: date,
  project: z.string().regex(/^(organization|proj_[a-zA-Z0-9_-]+)$/).max(160).optional(),
}).strict().refine(({ start, end }) => {
  const today = new Date().toISOString().slice(0, 10);
  const days = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  return days >= 0 && days < 90 && end <= today;
});
