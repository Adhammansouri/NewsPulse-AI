import Fastify from "fastify";
import { createAuthService, createToolServices, createWorkflowServices } from "./container.js";
import { corsPlugin } from "./plugins/cors.plugin.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.plugin.js";
import { jwtPlugin } from "./plugins/jwt.plugin.js";
import { staticPlugin } from "./plugins/static.plugin.js";
import { createApiRoutes } from "./routes/index.js";
import { createPushService } from "./services/pushService.js";

/**
 * The reverse proxy in front of the API: nginx / Caddy on the Docker network (a private address) or on the same host
 * (loopback). It appends the connecting client's address to X-Forwarded-For, and `request.ip` stops at the first
 * address that isn't one of these, so a client-supplied prefix is never trusted. Named by address, not a hop count:
 * since fastify 5.12.7 `trustProxy: 1` trusts nothing, and every client behind nginx shared one login rate limit.
 */
export const TRUSTED_PROXIES = "loopback, uniquelocal";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    // Image generation is silent on the socket until the PNG is ready (often past 2 minutes).
    requestTimeout: 660_000,
    connectionTimeout: 660_000,
    trustProxy: TRUSTED_PROXIES,
  });

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);

  const authService = await createAuthService(app);
  const pushService = createPushService(app.log);
  const { aggregator, workspace, storyUpdates, preferencesStore, ...toolServices } = createToolServices(app);
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
    storyUpdates.close();
    preferencesStore.close();
  });

  return app;
}
