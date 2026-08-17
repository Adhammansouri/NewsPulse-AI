import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../utils/errors.js";

const PUBLIC_API_ROUTES = new Set([
  "GET /api/health",
  "POST /api/auth/login",
  "POST /api/auth/forgot-password",
]);

function requestPath(url: string): string {
  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

function isPublicApiRequest(request: FastifyRequest): boolean {
  if (request.method === "OPTIONS") return true;
  return PUBLIC_API_ROUTES.has(`${request.method} ${requestPath(request.url)}`);
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
}

/** Default-deny JWT for /api except the public allowlist. */
export async function requireApiAuthUnlessPublic(request: FastifyRequest, reply: FastifyReply) {
  if (isPublicApiRequest(request)) return;
  await requireAuth(request, reply);
}