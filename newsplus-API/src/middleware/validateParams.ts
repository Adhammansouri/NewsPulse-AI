import type { FastifyRequest } from "fastify";
import type { ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

export function validateParams<T>(schema: ZodType<T>) {
  return async (request: FastifyRequest) => {
    const result = schema.safeParse(request.params);
    if (!result.success) {
      throw new ValidationError();
    }
    request.params = result.data as FastifyRequest["params"];
  };
}
