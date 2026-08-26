import type { FastifyPluginAsync } from "fastify";
import { createTranslateController } from "../controllers/translateController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { translateBodySchema } from "../schemas/translate.schema.js";
import type { TranslateService } from "../services/translateService.js";

export function createTranslateRoutes(translateService: TranslateService): FastifyPluginAsync {
  const controller = createTranslateController(translateService);

  return async (app) => {
    app.post("/translate", {
      preHandler: [aiRateLimit, validateBody(translateBodySchema)],
      handler: controller.translate,
    });
  };
}
