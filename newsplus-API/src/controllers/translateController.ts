import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { TranslateService } from "../services/translateService.js";
import type { TranslateBody } from "../schemas/translate.schema.js";

export function createTranslateController(translateService: TranslateService) {
  return {
    async translate(request: FastifyRequest<{ Body: TranslateBody }>, _reply: FastifyReply) {
      const data = await translateService.translate(request.body, request.user.sub);
      return successResponse(data);
    },
  };
}
