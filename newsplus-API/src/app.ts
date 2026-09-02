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
    // Behind nginx on VPS — use X-Forwarded-For for request.ip (login rate limit per client)
    trustProxy: true,
  });

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);

  const authService = await createAuthService(app);
  const pushService = createPushService(app.log);
  const { aggregator, ...toolServices } = createToolServices(app);
  await app.register(
    createApiRoutes({
      authService,
      pushService,
      ...toolServices,
    }),
    { prefix: "/api" },
  );
  await app.register(staticPlugin);

  app.addHook("onReady", async () => {
    void aggregator.start();
  });
  app.addHook("onClose", async () => {
    aggregator.stop();
  });

  return app;
}
