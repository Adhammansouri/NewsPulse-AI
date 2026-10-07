import assert from "node:assert/strict";
import { test } from "node:test";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/index.js";
import { TooManyRequestsError } from "../utils/errors.js";
import { loginRateLimit } from "./loginRateLimit.js";

test("changing an untrusted forwarded header cannot bypass the login attempt limit", async () => {
  const nodeEnv = env.nodeEnv;
  Object.assign(env, { nodeEnv: "production" });
  try {
    for (let i = 0; i < 15; i += 1) {
      await loginRateLimit({ ip: "198.51.100.83", headers: { "x-forwarded-for": `192.0.2.${i}` } } as unknown as FastifyRequest, {} as FastifyReply);
    }
    await assert.rejects(loginRateLimit({ ip: "198.51.100.83", headers: { "x-forwarded-for": "192.0.2.99" } } as unknown as FastifyRequest, {} as FastifyReply), TooManyRequestsError);
  } finally { Object.assign(env, { nodeEnv }); }
});
