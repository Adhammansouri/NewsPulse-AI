import type { FastifyPluginAsync } from "fastify";
import { createTimelineController } from "../controllers/timelineController.js";
import { validateParams } from "../middleware/validateParams.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { timelineParamsSchema, timelineQuerySchema } from "../schemas/timeline.schema.js";
import type { StoryTimelineService } from "../services/storyTimelineService.js";

/** S14 «تطور القصة». The AI rate limit is applied inside the handler, only when the model is called. */
export function createTimelineRoutes(timelineService: StoryTimelineService): FastifyPluginAsync {
  const controller = createTimelineController(timelineService);

  return async (app) => {
    app.get("/news/items/:id/timeline", {
      preHandler: [validateParams(timelineParamsSchema), validateQuery(timelineQuerySchema)],
      handler: controller.timeline,
    });
  };
}
