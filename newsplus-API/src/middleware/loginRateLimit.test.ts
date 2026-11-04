import assert from "node:assert/strict";
import { mock, test } from "node:test";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/index.js";
import { errorHandlerPlugin } from "../plugins/errorHandler.plugin.js";
import { createAuthRoutes } from "../routes/authRoutes.js";
import type { AuthService } from "../services/authService.js";
import { InvalidCredentialsError, TooManyRequestsError } from "../utils/errors.js";
import { loginRateLimit } from "./loginRateLimit.js";

const reply = { header() { return this; } } as unknown as FastifyReply;

test("changing an untrusted forwarded header cannot bypass the login attempt limit", async () => {
  const nodeEnv = env.nodeEnv;
  Object.assign(env, { nodeEnv: "production" });
  try {
    for (let i = 0; i < 15; i += 1) {
      await loginRateLimit({ ip: "198.51.100.83", headers: { "x-forwarded-for": `192.0.2.${i}` } } as unknown as FastifyRequest, reply);
    }
    await assert.rejects(loginRateLimit({ ip: "198.51.100.83", headers: { "x-forwarded-for": "192.0.2.99" } } as unknown as FastifyRequest, reply), TooManyRequestsError);
  } finally { Object.assign(env, { nodeEnv }); }
});

async function loginApp(nodeEnv: string) {
  const authService = {
    async login(_identifier: string, password: string) {
      if (password !== "right-password") throw new InvalidCredentialsError();
      return { token: "token", user: { id: "user-1" } };
    },
  } as unknown as AuthService;
  const previous = env.nodeEnv;
  Object.assign(env, { nodeEnv });
  const app = Fastify();
  await app.register(errorHandlerPlugin);
  await app.register(createAuthRoutes(authService), { prefix: "/api" });
  const login = (remoteAddress: string, payload: object) => app.inject({ method: "POST", url: "/api/auth/login", remoteAddress, payload });
  const close = async () => { await app.close(); Object.assign(env, { nodeEnv: previous }); };
  return { login, close };
}

test("every limited login response reports the remaining attempts, including 401 and 400", async () => {
  const { login, close } = await loginApp("production");
  try {
    const ok = await login("203.0.113.10", { identifier: "editor", password: "right-password" });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.headers["x-ratelimit-remaining"], "14");
    const wrong = await login("203.0.113.10", { identifier: "editor", password: "wrong-password" });
    assert.equal(wrong.statusCode, 401);
    assert.equal(wrong.headers["x-ratelimit-remaining"], "13");
    assert.equal(wrong.headers["retry-after"], undefined);
    const invalid = await login("203.0.113.10", {});
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.headers["x-ratelimit-remaining"], "12");
  } finally { await close(); }
});

test("a locked login reports zero remaining and whole seconds until the window resets", async () => {
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const { login, close } = await loginApp("production");
  const attempt = () => login("203.0.113.20", { identifier: "editor", password: "wrong-password" });
  try {
    for (let i = 0; i < 14; i += 1) await attempt();
    const last = await attempt();
    assert.equal(last.statusCode, 401);
    assert.equal(last.headers["x-ratelimit-remaining"], "0");
    const locked = await attempt();
    assert.equal(locked.statusCode, 429);
    assert.equal(locked.headers["x-ratelimit-remaining"], "0");
    assert.equal(locked.headers["retry-after"], "900");
    mock.timers.tick(600_500);
    assert.equal((await attempt()).headers["retry-after"], "300");
    mock.timers.tick(299_499);
    assert.equal((await attempt()).headers["retry-after"], "1");
    mock.timers.tick(1);
    const reopened = await attempt();
    assert.equal(reopened.statusCode, 401);
    assert.equal(reopened.headers["x-ratelimit-remaining"], "14");
    assert.equal(reopened.headers["retry-after"], undefined);
  } finally { await close(); mock.timers.reset(); }
});

test("outside production the login limiter neither locks nor sends rate-limit headers", async () => {
  const { login, close } = await loginApp("development");
  try {
    for (let i = 0; i < 16; i += 1) {
      const response = await login("203.0.113.30", { identifier: "editor", password: "wrong-password" });
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers["x-ratelimit-remaining"], undefined);
      assert.equal(response.headers["retry-after"], undefined);
    }
  } finally { await close(); }
});
