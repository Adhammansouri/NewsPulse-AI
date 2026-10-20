import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/index.js";
import { TooManyRequestsError } from "../utils/errors.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 15;
const SWEEP_AT = 500;
const buckets = new Map<string, Bucket>();

/** Expired buckets are only replaced when the same IP returns, so drop the rest once the map grows. */
function sweep(now: number) {
  if (buckets.size < SWEEP_AT) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function clientKey(request: FastifyRequest) {
  return request.ip || "unknown";
}

export async function loginRateLimit(request: FastifyRequest, _reply: FastifyReply) {
  if (env.nodeEnv !== "production") return;

  const now = Date.now();
  sweep(now);
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
