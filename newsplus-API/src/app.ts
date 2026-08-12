import Fastify from "fastify";
import { corsPlugin } from "./plugins/cors.plugin.js";
import { apiRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(corsPlugin);
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
