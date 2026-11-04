import assert from "node:assert/strict";
import { mock, test } from "node:test";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { errorHandlerPlugin } from "../plugins/errorHandler.plugin.js";
import { aiRateLimit, aiRateLimitBucketCount } from "./aiRateLimit.js";

const MINUTE = 60_000;
// Buckets are module state shared by the tests below, so each test starts later than the previous one.
const START = Date.now();

test("AI responses report remaining requests and a 429 carries Retry-After in whole seconds", async () => {
  mock.timers.enable({ apis: ["Date"], now: START });
  const app = Fastify();
  await app.register(errorHandlerPlugin);
  app.post("/api/ai-probe", { preHandler: [aiRateLimit], handler: async () => ({ status: "success" }) });
  const call = () => app.inject({ method: "POST", url: "/api/ai-probe", remoteAddress: "203.0.113.40" });
  try {
    const first = await call();
    assert.equal(first.statusCode, 200);
    assert.equal(first.headers["x-ratelimit-remaining"], "23");
    for (let i = 0; i < 22; i += 1) await call();
    const last = await call();
    assert.equal(last.statusCode, 200);
    assert.equal(last.headers["x-ratelimit-remaining"], "0");
    assert.equal(last.headers["retry-after"], undefined);
    const limited = await call();
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers["x-ratelimit-remaining"], "0");
    assert.equal(limited.headers["retry-after"], "900");
    mock.timers.tick(14 * MINUTE + 30_500);
    assert.equal((await call()).headers["retry-after"], "30");
    mock.timers.tick(29_500);
    const reopened = await call();
    assert.equal(reopened.statusCode, 200);
    assert.equal(reopened.headers["x-ratelimit-remaining"], "23");
  } finally { await app.close(); mock.timers.reset(); }
});

test("expired AI buckets are pruned on later calls while live ones keep their count", async () => {
  mock.timers.enable({ apis: ["Date"], now: START + 24 * 60 * MINUTE });
  const hit = async (ip: string) => {
    let remaining: unknown;
    const reply = { header(name: string, value: unknown) { if (name === "X-RateLimit-Remaining") remaining = value; return reply; } };
    await aiRateLimit({ ip } as unknown as FastifyRequest, reply as unknown as FastifyReply);
    return remaining;
  };
  try {
    for (let i = 0; i < 500; i += 1) await hit(`10.0.${i >> 8}.${i & 255}`);
    assert.equal(aiRateLimitBucketCount(), 500);
    mock.timers.tick(15 * MINUTE);
    await hit("198.51.100.1");
    assert.equal(aiRateLimitBucketCount(), 1);

    mock.timers.tick(MINUTE);
    await hit("198.51.100.2");
    mock.timers.tick(14 * MINUTE);
    // .1 expired and restarts behind .2, keeping the map in expiry order.
    assert.equal(await hit("198.51.100.1"), 23);
    assert.equal(aiRateLimitBucketCount(), 2);
    mock.timers.tick(MINUTE);
    // .2 expired and is pruned; the restarted .1 is still live and keeps its count.
    await hit("198.51.100.3");
    assert.equal(aiRateLimitBucketCount(), 2);
    assert.equal(await hit("198.51.100.1"), 22);
  } finally { mock.timers.reset(); }
});
