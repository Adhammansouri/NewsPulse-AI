import type { FastifyReply, FastifyRequest } from "fastify";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import type { TimelineParams, TimelineQuery } from "../schemas/timeline.schema.js";
import type { StoryTimelineService } from "../services/storyTimelineService.js";
import { successResponse } from "../utils/apiResponse.js";

export function createTimelineController(timelineService: StoryTimelineService) {
  return {
    /**
     * The AI rate limit applies only when this request makes the model call (a new snapshot, nothing cached, no
     * identical call in flight): reading a cached timeline, or `?analyze=0`, never spends the editor's AI budget.
     */
    async timeline(request: FastifyRequest<{ Params: TimelineParams; Querystring: TimelineQuery }>, reply: FastifyReply) {
      const { id } = request.params;
      const analyze = request.query.analyze !== "0";
      if (analyze && timelineService.needsModel(id)) await aiRateLimit(request, reply);
      const data = await timelineService.timeline(id, request.user.sub, { analyze });
      return successResponse(data);
    },
  };
}
