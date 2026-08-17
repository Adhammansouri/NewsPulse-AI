import type { FastifyPluginAsync } from "fastify";
import { createAuthController } from "../controllers/authController.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validateBody.js";
import { forgotPasswordBodySchema, loginBodySchema } from "../schemas/auth.schema.js";
import type { AuthService } from "../services/authService.js";

export function createAuthRoutes(authService: AuthService): FastifyPluginAsync {
  const controller = createAuthController(authService);

  return async (app) => {
    app.post("/auth/login", {
      preHandler: [loginRateLimit, validateBody(loginBodySchema)],
      handler: controller.login,
    });

    app.post("/auth/forgot-password", {
      preHandler: [validateBody(forgotPasswordBodySchema)],
      handler: controller.forgotPassword,
    });

    app.get("/auth/me", {
      preHandler: [requireAuth],
      handler: controller.me,
    });

    app.post("/auth/logout", {
      preHandler: [requireAuth],
      handler: controller.logout,
    });
  };
}