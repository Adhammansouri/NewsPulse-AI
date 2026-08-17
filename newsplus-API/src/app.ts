import Fastify from "fastify";
import { createAuthService } from "./container.js";
import { corsPlugin } from "./plugins/cors.plugin.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.plugin.js";
import { jwtPlugin } from "./plugins/jwt.plugin.js";
import { createApiRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);

  const authService = await createAuthService(app);
  await app.register(createApiRoutes(authService), { prefix: "/api" });

  return app;
}