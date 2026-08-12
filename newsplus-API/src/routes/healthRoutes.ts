import type { FastifyPluginAsync } from "fastify";
import { getHealth } from "../controllers/healthController.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => getHealth());
};
