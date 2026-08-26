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
    wildcard: false,
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api")) {
      return reply.status(404).send(failResponse("not-found"));
    }

    return reply.sendFile("index.html");
  });
};

export const staticPlugin = fp(staticPluginImpl);
