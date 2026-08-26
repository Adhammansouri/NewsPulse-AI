import type { FastifyPluginAsync } from "fastify";
import { requireApiAuthUnlessPublic } from "../middleware/requireAuth.js";
import { createAuthRoutes } from "./authRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import { createPushRoutes } from "./pushRoutes.js";
import type { AuthService } from "../services/authService.js";
import type { PushService } from "../services/pushService.js";

export function createApiRoutes(authService: AuthService, pushService: PushService): FastifyPluginAsync {
  return async (app) => {
    app.addHook("onRequest", requireApiAuthUnlessPublic);
    await app.register(healthRoutes);
    await app.register(createAuthRoutes(authService));
    await app.register(createPushRoutes(pushService));
  };
}