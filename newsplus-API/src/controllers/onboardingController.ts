import type { FastifyReply, FastifyRequest } from "fastify";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import type { HookStylesBody, UserPreferencesUpdateBody } from "../schemas/onboarding.schema.js";
import type { HookStylesService } from "../services/hookStylesService.js";
import type { UserPreferencesService } from "../services/userPreferencesService.js";
import { successResponse } from "../utils/apiResponse.js";

export function createOnboardingController(preferences: UserPreferencesService, hookStyles: HookStylesService) {
  return {
    async getPreferences(request: FastifyRequest, _reply: FastifyReply) {
      return successResponse(preferences.get(request.user.sub));
    },

    async updatePreferences(request: FastifyRequest<{ Body: UserPreferencesUpdateBody }>, _reply: FastifyReply) {
      return successResponse(preferences.update(request.user.sub, request.body));
    },

    /**
     * The AI rate limit applies only when this request makes the model call (nothing cached for the story's
     * headline, no identical call in flight): hooks already written, or an unknown story (404), never spend it.
     */
    async hookStyles(request: FastifyRequest<{ Body: HookStylesBody }>, reply: FastifyReply) {
      const { itemId } = request.body;
      if (await hookStyles.needsModel(itemId)) await aiRateLimit(request, reply);
      return successResponse(await hookStyles.styles(itemId, request.user.sub));
    },
  };
}
