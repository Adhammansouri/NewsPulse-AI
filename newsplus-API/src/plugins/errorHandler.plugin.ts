import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/index.js";
import { failResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/errors.js";

const errorHandlerPluginImpl: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(failResponse(error.publicMessage));
    }

    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send(failResponse("invalid-request"));
    }

    request.log.error(error);

    const message = env.nodeEnv === "production" || !(error instanceof Error)
      ? "internal-error"
      : error.message;
    return reply.status(500).send(failResponse(message));
  });
};

export const errorHandlerPlugin = fp(errorHandlerPluginImpl);
