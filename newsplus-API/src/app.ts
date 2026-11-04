import Fastify from "fastify";
import { createAuthService, createToolServices, createWorkflowServices } from "./container.js";
import { corsPlugin } from "./plugins/cors.plugin.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.plugin.js";
import { jwtPlugin } from "./plugins/jwt.plugin.js";
import { staticPlugin } from "./plugins/static.plugin.js";
import { createApiRoutes } from "./routes/index.js";
import { createPushService } from "./services/pushService.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    // Image generation is silent on the socket until the PNG is ready (often past 2 minutes).
    requestTimeout: 660_000,
    connectionTimeout: 660_000,
    // nginx appends the connecting client's address. Trust only that nearest hop,
    // not a client-supplied prefix in X-Forwarded-For.
    trustProxy: 1,
  });

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);

  const authService = await createAuthService(app);
  const pushService = createPushService(app.log);
  const { aggregator, workspace, ...toolServices } = createToolServices(app);
  await app.register(
    createApiRoutes({
      authService,
      pushService,
      ...toolServices,
      ...createWorkflowServices(authService, workspace),
    }),
    { prefix: "/api" },
  );
  await app.register(staticPlugin);

  app.addHook("onReady", async () => {
    void aggregator.start();
  });
  app.addHook("onClose", async () => {
    aggregator.stop();
    workspace.close();
  });

  return app;
}
