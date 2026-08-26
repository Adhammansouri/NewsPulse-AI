import type { FastifyReply, FastifyRequest } from "fastify";
import { TooManyRequestsError } from "../utils/errors.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const buckets = new Map<string, Bucket>();

function clientKey(request: FastifyRequest) {
  return request.ip || "unknown";
}

export async function loginRateLimit(request: FastifyRequest, _reply: FastifyReply) {
  const now = Date.now();
  const key = clientKey(request);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  current.count += 1;
  if (current.count > MAX_ATTEMPTS) {
    throw new TooManyRequestsError();
  }
}