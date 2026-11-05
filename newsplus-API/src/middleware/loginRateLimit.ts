import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/index.js";
import { TooManyRequestsError } from "../utils/errors.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 15;
const buckets = new Map<string, Bucket>();

function clientKey(request: FastifyRequest) {
  return request.ip || "unknown";
}

export async function loginRateLimit(request: FastifyRequest, reply: FastifyReply) {
  if (env.nodeEnv !== "production") return;

  const now = Date.now();
  const key = clientKey(request);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    reply.header("X-RateLimit-Remaining", MAX_ATTEMPTS - 1);
    return;
  }

  current.count += 1;
  reply.header("X-RateLimit-Remaining", Math.max(0, MAX_ATTEMPTS - current.count));
  if (current.count > MAX_ATTEMPTS) {
    reply.header("Retry-After", Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
    throw new TooManyRequestsError();
  }
}
