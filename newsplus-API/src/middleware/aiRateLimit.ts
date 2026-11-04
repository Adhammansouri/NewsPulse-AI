import type { FastifyReply, FastifyRequest } from "fastify";
import { TooManyRequestsError } from "../utils/errors.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 24;
// Every bucket lives exactly WINDOW_MS and is (re)appended when its window starts,
// so the Map's insertion order is also its expiry order.
const buckets = new Map<string, Bucket>();

function clientKey(request: FastifyRequest) {
  return request.user?.sub ?? request.ip ?? "unknown";
}

/** Drops expired buckets from the front and stops at the first live one: amortized O(1) per request. */
function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt > now) break;
    buckets.delete(key);
  }
}

/** Number of tracked clients; exported for tests. */
export function aiRateLimitBucketCount() {
  return buckets.size;
}

export async function aiRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const now = Date.now();
  pruneExpired(now);
  const key = clientKey(request);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    // Delete first: Map.set on an existing key would keep its old (earlier) position.
    buckets.delete(key);
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
