import type { FastifyPluginAsync } from "fastify";
import type { OpenAIUsageQuery } from "@newsplus/shared";
import type { AuthService } from "../services/authService.js";
import type { OpenAIUsageService } from "../services/openaiUsageService.js";
import { env } from "../config/index.js";
import { normalizeIdentifier } from "../utils/identifier.js";
import { AppError } from "../utils/errors.js";
import { successResponse } from "../utils/apiResponse.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { openaiUsageQuerySchema } from "../schemas/openaiUsage.schema.js";

export function createOpenAIUsageRoutes(service: OpenAIUsageService, auth: AuthService): FastifyPluginAsync {
  return async (app) => {
    app.get<{ Querystring: OpenAIUsageQuery }>("/openai/usage", {
      preHandler: [async (request) => {
        const user = await auth.getUserById(request.user.sub);
        // This workspace's configured seed account owns its shared OpenAI key.
        if (user.role !== "admin" && normalizeIdentifier(user.identifier) !== normalizeIdentifier(env.authSeedIdentifier)) throw new AppError(403, "openai-usage-forbidden");
      }, validateQuery(openaiUsageQuerySchema)],
    }, async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      return successResponse(await service.get(request.query));
    });
  };
}
