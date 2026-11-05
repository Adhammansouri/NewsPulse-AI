import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config/index.js";
import { buildApp } from "./app.js";
import { OpenAIClient } from "./ai/openaiClient.js";
import { NewsAggregator } from "./services/newsAggregator.js";

// S13 routes through the assembled app. The OpenAI client is never reached: first unconfigured (503), then
// `completeJson` is mocked on the prototype.
test("S13 breaking and digest routes keep auth, validation, the AI rate limit and their contracts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s13-routes-"));
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: ":memory:",
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "s13-editor",
    authSeedPassword: "test-only-password",
  });
  const now = Date.now();
  const item = {
    id: "story-1",
    title: "المركزي يثبت الفائدة",
    excerpt: "",
    publishedAt: new Date(now - 5 * 60_000).toISOString(),
    breaking: true,
    topic: "economy" as const,
    sources: [{ id: "a", name: "Outlet A", url: "https://example.com/a" }],
  };
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const feed = mock.method(NewsAggregator.prototype, "getFeed", async () => ({ fetchedAt: new Date().toISOString(), items: [item] }));
  const getItem = mock.method(NewsAggregator.prototype, "getItem", async (id: string) => (id === item.id ? item : null));
  const app = await buildApp();
  app.log.level = "silent";
  try {
    const since = new Date(now - 8 * 60 * 60_000).toISOString();
    for (const [url, payload] of [["/api/news/breaking", { itemId: item.id }], ["/api/news/digest", { since }]] as const) {
      assert.equal((await app.inject({ method: "POST", url, payload })).statusCode, 401, url);
    }

    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { identifier: "s13-editor", password: "test-only-password" } });
    const headers = { authorization: `Bearer ${login.json().data.token}` };

    for (const [url, payload] of [
      ["/api/news/breaking", {}],
      ["/api/news/breaking", { itemId: "abc" }],
      ["/api/news/digest", {}],
      ["/api/news/digest", { since: "last night" }],
      ["/api/news/digest", { since: new Date(now + 60 * 60_000).toISOString() }],
    ] as const) {
      const response = await app.inject({ method: "POST", url, headers, payload });
      assert.equal(response.statusCode, 400, `${url} ${JSON.stringify(payload)}`);
      assert.equal(response.json().message, "invalid-request");
    }

    for (const [url, payload] of [["/api/news/breaking", { itemId: item.id }], ["/api/news/digest", { since }]] as const) {
      const response = await app.inject({ method: "POST", url, headers, payload });
      assert.equal(response.statusCode, 503, url);
      assert.equal(response.json().message, "openai-not-configured");
      assert.ok(response.headers["x-ratelimit-remaining"] !== undefined, `${url} counts toward aiRateLimit`);
    }

    const completeJson = mock.method(OpenAIClient.prototype, "completeJson", async (options: Parameters<OpenAIClient["completeJson"]>[0]) =>
      options.parse(
        options.schemaName === "breaking_outputs"
          ? { post: "المركزي يثبت الفائدة #عاجل", ticker: "المركزي يثبت الفائدة", alert: "المركزي يثبت الفائدة" }
          : { items: [{ itemId: item.id, reason: "الأهم اقتصادياً" }], summaryText: "1. المركزي يثبت الفائدة." },
      ),
    );
    try {
      const breaking = await app.inject({ method: "POST", url: "/api/news/breaking", headers, payload: { itemId: item.id } });
      assert.equal(breaking.statusCode, 200);
      const data = breaking.json().data;
      assert.equal(data.post, "عاجل | المركزي يثبت الفائدة #عاجل");
      assert.equal(data.ticker, "عاجل: المركزي يثبت الفائدة");
      assert.equal(data.alert, "المركزي يثبت الفائدة");
      assert.equal(typeof data.ms, "number");

      const unknown = await app.inject({ method: "POST", url: "/api/news/breaking", headers, payload: { itemId: "missing-item" } });
      assert.equal(unknown.statusCode, 400);

      const digest = await app.inject({ method: "POST", url: "/api/news/digest", headers, payload: { since } });
      assert.equal(digest.statusCode, 200);
      assert.deepEqual(digest.json().data, {
        items: [{ itemId: item.id, title: item.title, reason: "الأهم اقتصادياً" }],
        summaryText: "1. المركزي يثبت الفائدة.",
        sourceCount: 1,
      });
      const again = await app.inject({ method: "POST", url: "/api/news/digest", headers, payload: { since } });
      assert.deepEqual(again.json().data, digest.json().data);
      assert.equal(completeJson.mock.callCount(), 2, "one breaking call + one digest call (the repeat is cached)");
    } finally {
      completeJson.mock.restore();
    }
  } finally {
    await app.close();
    start.mock.restore();
    feed.mock.restore();
    getItem.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
