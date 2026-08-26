import type { FastifyPluginAsync } from "fastify";
import { createNewsController } from "../controllers/newsController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { newsFeedQuerySchema, newsSummarizeBodySchema } from "../schemas/news.schema.js";
import type { NewsService } from "../services/newsService.js";

export function createNewsRoutes(newsService: NewsService): FastifyPluginAsync {
  const controller = createNewsController(newsService);

  return async (app) => {
    app.get("/news/sources", {
      handler: controller.sources,
    });

    app.get("/news/feed", {
      preHandler: [validateQuery(newsFeedQuerySchema)],
      handler: controller.feed,
    });

    app.post("/news/summarize", {
      preHandler: [aiRateLimit, validateBody(newsSummarizeBodySchema)],
      handler: controller.summarize,
    });
  };
}
