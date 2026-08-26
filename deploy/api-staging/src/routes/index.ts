import type { FastifyPluginAsync } from "fastify";
import { requireApiAuthUnlessPublic } from "../middleware/requireAuth.js";
import { createAuthRoutes } from "./authRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import type { AuthService } from "../services/authService.js";

export function createApiRoutes(authService: AuthService): FastifyPluginAsync {
  return async (app) => {
    app.addHook("onRequest", requireApiAuthUnlessPublic);
    await app.register(healthRoutes);
    await app.register(createAuthRoutes(authService));
  };
}