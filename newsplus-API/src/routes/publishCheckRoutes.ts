import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateParams } from "../middleware/validateParams.js";
import { editorialConversationIdParamsSchema, type EditorialConversationIdParams } from "../schemas/editorial.schema.js";
import { publishCheckBodySchema, type PublishCheckBody } from "../schemas/publishCheck.schema.js";
import type { PublishCheckService } from "../services/publishCheckService.js";
import { successResponse } from "../utils/apiResponse.js";

type CheckRequest = FastifyRequest<{ Params: EditorialConversationIdParams; Body: PublishCheckBody }>;

/**
 * S12 «فحص قبل النشر»: `POST /editorial/conversations/:id/check`. Auth and conversation access are the
 * neighbouring editorial routes' (the API-wide auth hook; any team member, an unknown id is 404). The request
 * counts toward `aiRateLimit` when it calls the model: a version already checked is answered from the cache.
 */
export function createPublishCheckRoutes(service: PublishCheckService): FastifyPluginAsync {
  async function aiRateLimitOnModelCall(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as EditorialConversationIdParams;
    if (service.needsAi(id)) await aiRateLimit(request, reply);
  }

  return async (app) => {
    app.post("/editorial/conversations/:id/check", {
      preHandler: [
        validateParams(editorialConversationIdParamsSchema),
        validateBody(publishCheckBodySchema),
        aiRateLimitOnModelCall,
      ],
      handler: async (request: CheckRequest, _reply: FastifyReply) =>
        successResponse(await service.check(request.params.id, request.body?.platform, request.user.sub)),
    });
  };
}
