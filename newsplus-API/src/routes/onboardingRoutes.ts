import type { FastifyPluginAsync } from "fastify";
import { createOnboardingController } from "../controllers/onboardingController.js";
import { validateBody } from "../middleware/validateBody.js";
import { hookStylesBodySchema, userPreferencesUpdateBodySchema } from "../schemas/onboarding.schema.js";
import type { HookStylesService } from "../services/hookStylesService.js";
import type { UserPreferencesService } from "../services/userPreferencesService.js";

/**
 * S16 onboarding: the signed-in editor's preferences and the three hook styles of step 3. Auth is the API-wide hook
 * (every route here needs a session); preferences are always the caller's own (`request.user.sub`).
 */
export function createOnboardingRoutes(preferences: UserPreferencesService, hookStyles: HookStylesService): FastifyPluginAsync {
  const controller = createOnboardingController(preferences, hookStyles);

  return async (app) => {
    app.get("/me/preferences", {
      handler: controller.getPreferences,
    });

    app.put("/me/preferences", {
      preHandler: [validateBody(userPreferencesUpdateBodySchema)],
      handler: controller.updatePreferences,
    });

    app.post("/news/hook-styles", {
      preHandler: [validateBody(hookStylesBodySchema)],
      handler: controller.hookStyles,
    });
  };
}
