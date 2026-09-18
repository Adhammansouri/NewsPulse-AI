import { z } from "zod";

export const editorialConversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const editorialConversationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
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
    status: z.enum(["approved", "rejected", "disabled"]).optional(),
    instruction: z.string().trim().min(18).max(280).optional(),
  })
  .refine((value) => Boolean(value.status || value.instruction), {
    message: "invalid-request",
  });

export type EditorialConversationIdParams = z.infer<typeof editorialConversationIdParamsSchema>;
export type EditorialConversationListQuery = z.infer<typeof editorialConversationListQuerySchema>;
export type EditorialReviseBody = z.infer<typeof editorialReviseBodySchema>;
export type EditorialRestoreBody = z.infer<typeof editorialRestoreBodySchema>;
export type EditorialMemoryListQuery = z.infer<typeof editorialMemoryListQuerySchema>;
export type EditorialMemoryUpdateBody = z.infer<typeof editorialMemoryUpdateBodySchema>;
