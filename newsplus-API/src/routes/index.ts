import type { FastifyPluginAsync } from "fastify";
import { createAuthRoutes } from "./authRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import type { AuthService } from "../services/authService.js";

export function createApiRoutes(authService: AuthService): FastifyPluginAsync {
  return async (app) => {
    await app.register(healthRoutes);
    await app.register(createAuthRoutes(authService));
  };
}