import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

export function validateBody<T>(schema: ZodType<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError();
    }
    request.body = result.data;
  };
}