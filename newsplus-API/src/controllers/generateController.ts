import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { GenerateService } from "../services/generateService.js";
import type { GenerateBody } from "../schemas/generate.schema.js";

export function createGenerateController(generateService: GenerateService) {
  return {
    async generate(request: FastifyRequest<{ Body: GenerateBody }>, _reply: FastifyReply) {
      const data = await generateService.generate(request.body, request.user.sub);
      return successResponse(data);
    },
  };
}
