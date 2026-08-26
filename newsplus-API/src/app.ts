import Fastify from "fastify";
import { createAuthService, createToolServices } from "./container.js";
import { corsPlugin } from "./plugins/cors.plugin.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.plugin.js";
import { jwtPlugin } from "./plugins/jwt.plugin.js";
import { staticPlugin } from "./plugins/static.plugin.js";
import { createApiRoutes } from "./routes/index.js";
import { createPushService } from "./services/pushService.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    requestTimeout: 120_000,
    connectionTimeout: 120_000,
  });

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);

  const authService = await createAuthService(app);
  const pushService = createPushService(app.log);
  const tools = createToolServices(app);
  await app.register(
    createApiRoutes({
      authService,
      pushService,
      ...tools,
    }),
    { prefix: "/api" },
  );
  await app.register(staticPlugin);

  return app;
}
