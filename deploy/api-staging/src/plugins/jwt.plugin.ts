import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/index.js";

const jwtPluginImpl: FastifyPluginAsync = async (app) => {
  await app.register(jwt, {
    secret: env.jwtSecret,
    sign: {
      expiresIn: "7d",
    },
  });
};

export const jwtPlugin = fp(jwtPluginImpl);