import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/index.js";

export const corsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: env.corsOrigin,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("Access-Control-Allow-Origin", env.corsOrigin);
    reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
    reply.header("Vary", "Origin");

    return payload;
  });
};
