import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/index.js";

export const corsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: env.corsOrigin,
  });
};
