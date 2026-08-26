import type { FastifyPluginAsync } from "fastify";
import { createGenerateController } from "../controllers/generateController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { generateBodySchema } from "../schemas/generate.schema.js";
import type { GenerateService } from "../services/generateService.js";

export function createGenerateRoutes(generateService: GenerateService): FastifyPluginAsync {
  const controller = createGenerateController(generateService);

  return async (app) => {
    app.post("/generate", {
      preHandler: [aiRateLimit, validateBody(generateBodySchema)],
      handler: controller.generate,
    });
  };
}
