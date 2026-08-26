import type { FastifyRequest } from "fastify";
import type { ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

export function validateQuery<T>(schema: ZodType<T>) {
  return async (request: FastifyRequest) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      throw new ValidationError();
    }
    request.query = result.data as FastifyRequest["query"];
  };
}
