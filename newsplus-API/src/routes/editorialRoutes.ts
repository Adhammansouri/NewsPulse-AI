import type { FastifyPluginAsync } from "fastify";
import { createEditorialController } from "../controllers/editorialController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateParams } from "../middleware/validateParams.js";
import { validateQuery } from "../middleware/validateQuery.js";
import {
  editorialConversationIdParamsSchema,
  editorialConversationListQuerySchema,
  editorialConversationUpdateBodySchema,
  editorialMemoryListQuerySchema,
  editorialMemoryUpdateBodySchema,
  editorialRestoreBodySchema,
  editorialReviseBodySchema,
} from "../schemas/editorial.schema.js";
import type { EditorialConversationService } from "../services/editorialConversationService.js";
import type { EditorialWorkflowService } from "../services/editorialWorkflowService.js";

export function createEditorialRoutes(
  service: EditorialConversationService,
  workflow: EditorialWorkflowService,
): FastifyPluginAsync {
  const controller = createEditorialController(service, workflow);

  return async (app) => {
    app.get("/editorial/conversations", {
      preHandler: [validateQuery(editorialConversationListQuerySchema)],
      handler: controller.list,
    });

    app.get("/editorial/conversations/:id", {
      preHandler: [validateParams(editorialConversationIdParamsSchema)],
      handler: controller.get,
    });

    app.patch("/editorial/conversations/:id", {
      preHandler: [
        validateParams(editorialConversationIdParamsSchema),
        validateBody(editorialConversationUpdateBodySchema),
      ],
      handler: controller.update,
    });

    app.post("/editorial/conversations/:id/revise", {
      preHandler: [
        aiRateLimit,
        validateParams(editorialConversationIdParamsSchema),
        validateBody(editorialReviseBodySchema),
      ],
      handler: controller.revise,
    });

    app.post("/editorial/conversations/:id/restore", {
      preHandler: [validateParams(editorialConversationIdParamsSchema), validateBody(editorialRestoreBodySchema)],
      handler: controller.restore,
    });

    app.get("/editorial/memory", {
      preHandler: [validateQuery(editorialMemoryListQuerySchema)],
      handler: controller.listMemory,
    });

    app.post("/editorial/memory/:id", {
      preHandler: [validateParams(editorialConversationIdParamsSchema), validateBody(editorialMemoryUpdateBodySchema)],
      handler: controller.updateMemory,
    });
  };
}
