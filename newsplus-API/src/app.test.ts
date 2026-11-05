import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify from "fastify";
import { env } from "./config/index.js";
import { buildApp, TRUSTED_PROXIES } from "./app.js";
import { NewsAggregator } from "./services/newsAggregator.js";

test("client address: the reverse proxy's X-Forwarded-For is trusted, a client-supplied one is not", async () => {
  const app = Fastify({ trustProxy: TRUSTED_PROXIES });
  app.get("/ip", async (request) => request.ip);
  const ipFrom = async (remoteAddress: string, forwardedFor: string) =>
    (await app.inject({ url: "/ip", remoteAddress, headers: { "x-forwarded-for": forwardedFor } })).body;
  try {
    // nginx on the Docker network, Caddy, or a proxy on the same host: the client it appended.
    assert.equal(await ipFrom("172.18.0.5", "203.0.113.7"), "203.0.113.7");
    assert.equal(await ipFrom("10.0.0.2", "203.0.113.7"), "203.0.113.7");
    assert.equal(await ipFrom("127.0.0.1", "203.0.113.7"), "203.0.113.7");
    // A client that sends its own X-Forwarded-For through nginx keeps its real address (one rate-limit bucket each).
    assert.equal(await ipFrom("172.18.0.5", "198.51.100.1, 203.0.113.7"), "203.0.113.7");
    // A client reaching the API directly can't pick its address.
    assert.equal(await ipFrom("203.0.113.9", "198.51.100.1"), "203.0.113.9");
  } finally {
    await app.close();
  }
});

test("assembled API preserves authentication, CORS, validation and tool error contracts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-api-test-"));
  const originalEnv = { ...env };
  Object.assign(env, { editorialStorePath: ":memory:", pushStorePath: join(directory, "push.json"), openaiApiKey: "", authSeedIdentifier: "audit-editor", authSeedPassword: "test-only-password" });
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const feed = mock.method(NewsAggregator.prototype, "getFeed", async () => ({ fetchedAt: new Date().toISOString(), items: [] }));
  const app = await buildApp();
  app.log.level = "silent";
  try {
    assert.equal((await app.inject("/api/health")).statusCode, 200);
    for (const url of ["/api/auth/me", "/api/news/feed", "/api/editorial/conversations", "/api/push/vapid-key"]) {
      assert.equal((await app.inject(url)).statusCode, 401);
    }
    const invalid = await app.inject({ method: "POST", url: "/api/auth/login", payload: {} });
    assert.equal(invalid.statusCode, 400);
    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { identifier: "audit-editor", password: "test-only-password" } });
    assert.equal(login.statusCode, 200);
    const { token, user } = login.json().data;
    const headers = { authorization: `Bearer ${token}`, origin: env.corsOrigin };
    const me = await app.inject({ url: "/api/auth/me", headers });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().data.user.id, user.id);
    assert.equal(me.headers["access-control-allow-origin"], env.corsOrigin);
    assert.match(String(me.headers["cache-control"]), /no-store/);
    for (const url of ["/api/news/sources", "/api/news/feed", "/api/editorial/conversations", "/api/editorial/memory"]) {
      const response = await app.inject({ url, headers });
      assert.equal(response.statusCode, 200, url);
      assert.equal(response.json().status, "success");
    }
    for (const [url, payload] of [
      ["/api/news/summarize", { input: "Test news topic" }],
      ["/api/generate", { prompt: "Test news assignment", style: "brief", language: "en" }],
      ["/api/translate", { text: "Test article", target: "ar" }],
    ] as const) {
      const response = await app.inject({ method: "POST", url, headers, payload });
      assert.equal(response.statusCode, 503, url);
      assert.equal(response.json().message, "openai-not-configured");
    }
    const preflight = await app.inject({ method: "OPTIONS", url: "/api/editorial/memory/test", headers: { origin: env.corsOrigin, "access-control-request-method": "POST", "access-control-request-headers": "authorization,content-type" } });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers["access-control-allow-origin"], env.corsOrigin);
  } finally {
    await app.close(); start.mock.restore(); feed.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
