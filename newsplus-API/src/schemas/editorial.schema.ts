import { z } from "zod";
import { PUBLISH_PLATFORMS, WORKFLOW_STATUSES } from "../services/editorialWorkflow.js";

export const editorialConversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const editorialConversationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  scope: z.enum(["team", "mine"]).optional(),
  status: z.enum(WORKFLOW_STATUSES).optional(),
});

export const editorialConversationUpdateBodySchema = z
  .object({
    status: z.enum(WORKFLOW_STATUSES).optional(),
    assigneeId: z.string().trim().min(1).max(64).optional(),
    publishedPlatforms: z
      .array(z.enum(PUBLISH_PLATFORMS))
      .max(PUBLISH_PLATFORMS.length * 2)
      .transform((platforms) => [...new Set(platforms)])
      .optional(),
  })
  .refine((value) => value.status !== undefined || value.assigneeId !== undefined || value.publishedPlatforms !== undefined, {
    message: "invalid-request",
  });

export const editorialReviseBodySchema = z.object({
  instruction: z.string().trim().min(1).max(4_000),
});

export const editorialRestoreBodySchema = z.object({
  versionId: z.string().uuid(),
});

export const editorialMemoryListQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "disabled"]).optional(),
});

export const editorialMemoryUpdateBodySchema = z
  .object({
    // "pending" only undoes an approval (S10 «تراجع» on «القاعدة اتحفظت لذاكرة الفريق»); the store enforces it.
    status: z.enum(["pending", "approved", "rejected", "disabled"]).optional(),
    instruction: z.string().trim().min(18).max(280).optional(),
  })
  .refine((value) => Boolean(value.status || value.instruction), {
    message: "invalid-request",
  });

export type EditorialConversationIdParams = z.infer<typeof editorialConversationIdParamsSchema>;
export type EditorialConversationListQuery = z.infer<typeof editorialConversationListQuerySchema>;
export type EditorialConversationUpdateBody = z.infer<typeof editorialConversationUpdateBodySchema>;
export type EditorialReviseBody = z.infer<typeof editorialReviseBodySchema>;
export type EditorialRestoreBody = z.infer<typeof editorialRestoreBodySchema>;
export type EditorialMemoryListQuery = z.infer<typeof editorialMemoryListQuerySchema>;
export type EditorialMemoryUpdateBody = z.infer<typeof editorialMemoryUpdateBodySchema>;
