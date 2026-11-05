import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { NewsBreakingBody, NewsDigestBody } from "../schemas/breakingDigest.schema.js";
import type { BreakingService } from "../services/breakingService.js";
import type { DigestService } from "../services/digestService.js";

export function createBreakingDigestController(breakingService: BreakingService, digestService: DigestService) {
  return {
    async breaking(request: FastifyRequest<{ Body: NewsBreakingBody }>, _reply: FastifyReply) {
      const data = await breakingService.breaking(request.body.itemId, request.user.sub);
      return successResponse(data);
    },

    async digest(request: FastifyRequest<{ Body: NewsDigestBody }>, _reply: FastifyReply) {
      const data = await digestService.digest(request.body.since, request.user.sub);
      return successResponse(data);
    },
  };
}
