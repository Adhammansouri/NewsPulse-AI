import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../utils/errors.js";

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
}