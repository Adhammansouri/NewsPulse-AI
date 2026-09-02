import fastifyStatic from "@fastify/static";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { failResponse } from "../utils/apiResponse.js";

const publicDir = path.join(fileURLToPath(new URL("../..", import.meta.url)), "public");

const staticPluginImpl: FastifyPluginAsync = async (app) => {
  if (!existsSync(path.join(publicDir, "index.html"))) {
    return;
  }

  await app.register(fastifyStatic, {
    root: publicDir,
    setHeaders(reply, filePath) {
      if (filePath.endsWith(".webmanifest")) {
        reply.header("Content-Type", "application/manifest+json");
      }
      if (/(?:^|[\\/])(?:sw\.js|workbox-.+\.js)$/.test(filePath)) {
        reply.header("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api")) {
      return reply.status(404).send(failResponse("not-found"));
    }

    return reply.sendFile("index.html");
  });
};

export const staticPlugin = fp(staticPluginImpl);
