import cors from "@fastify/cors";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/index.js";

const DEV_ORIGIN_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1):\d+$/;

function resolveCorsOrigin(requestOrigin: string | undefined) {
  if (!requestOrigin) return env.corsOrigin;
  if (requestOrigin === env.corsOrigin) return requestOrigin;
  if (env.nodeEnv !== "production" && DEV_ORIGIN_PATTERN.test(requestOrigin)) {
    return requestOrigin;
  }
  return env.corsOrigin;
}

const corsPluginImpl: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, resolveCorsOrigin(origin));
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Retry-After", "X-RateLimit-Remaining"],
  });

  app.addHook("onSend", async (request, reply, payload) => {
    if (request.url === "/api" || request.url.startsWith("/api/")) {
      reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
    }

    return payload;
  });
};

export const corsPlugin = fp(corsPluginImpl);
