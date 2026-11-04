import type { FastifyPluginAsync } from "fastify";
import { createBreakingDigestController } from "../controllers/breakingDigestController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { newsBreakingBodySchema, newsDigestBodySchema } from "../schemas/breakingDigest.schema.js";
import type { BreakingService } from "../services/breakingService.js";
import type { DigestService } from "../services/digestService.js";

/** S13: breaking mode and «اللي فاتك». Both are AI calls, so both count toward `aiRateLimit`. */
export function createBreakingDigestRoutes(breakingService: BreakingService, digestService: DigestService): FastifyPluginAsync {
  const controller = createBreakingDigestController(breakingService, digestService);

  return async (app) => {
    app.post("/news/breaking", {
      preHandler: [aiRateLimit, validateBody(newsBreakingBodySchema)],
      handler: controller.breaking,
    });

    app.post("/news/digest", {
      preHandler: [aiRateLimit, validateBody(newsDigestBodySchema)],
      handler: controller.digest,
    });
  };
}
