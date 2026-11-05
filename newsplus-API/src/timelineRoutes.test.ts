import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config/index.js";
import { buildApp } from "./app.js";
import { OpenAIClient } from "./ai/openaiClient.js";
import { NewsAggregator } from "./services/newsAggregator.js";
import { StoryUpdatesStore, type StoryUpdate } from "./services/storyUpdatesStore.js";

// S14 `GET /news/items/:id/timeline` through the assembled app: auth, validation, the contract, and the AI rate
// limit spent only by the request that calls the model. OpenAI is mocked; the snapshot store is in memory.
test("S14 timeline route keeps auth and validation, and rate-limits only the model call", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s14-routes-"));
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: ":memory:",
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "s14-editor",
    authSeedPassword: "test-only-password",
  });
  const now = Date.now();
  const item = {
    id: "story-1",
    title: "المركزي يثبت الفائدة",
    excerpt: "",
    publishedAt: new Date(now - 5 * 60_000).toISOString(),
    breaking: false,
    topic: "economy" as const,
    sources: [
      { id: "a", name: "Outlet A", url: "https://example.com/a" },
      { id: "b", name: "Outlet B", url: "https://example.com/b" },
    ],
  };
  const updates: StoryUpdate[] = [
    { id: 1, itemId: "story-1", sourceId: "a", atMs: now - 12 * 60_000, headline: "الفائدة دون تغيير", excerpt: "", url: "https://example.com/a" },
    { id: 2, itemId: "story-1", sourceId: "b", atMs: now - 2 * 60_000, headline: "التضخم ٣٫١٪", excerpt: "", url: "https://example.com/b" },
  ];
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const getItem = mock.method(NewsAggregator.prototype, "getItem", async (id: string) => (id === item.id ? item : null));
  const list = mock.method(StoryUpdatesStore.prototype, "list", (id: string) => (id === item.id ? updates : []));
  const completeJson = mock.method(OpenAIClient.prototype, "completeJson", async (options: Parameters<OpenAIClient["completeJson"]>[0]) =>
    options.parse({
      tags: [{ n: 2, tag: "number" }],
      conflicts: [{ field: "نسبة التضخم", values: [{ sourceId: "a", value: "٢٫٩٪" }, { sourceId: "b", value: "٣٫١٪" }], safeWording: "حوالي ٣٪" }],
      agreed: [{ text: "تثبيت الفائدة", sourceIds: ["a", "b"] }],
    }),
  );
  const app = await buildApp();
  app.log.level = "silent";
  try {
    const url = "/api/news/items/story-1/timeline";
    assert.equal((await app.inject({ method: "GET", url })).statusCode, 401);

    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { identifier: "s14-editor", password: "test-only-password" } });
    const headers = { authorization: `Bearer ${login.json().data.token}` };

    const invalid = await app.inject({ method: "GET", url: "/api/news/items/abc/timeline", headers });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.json().message, "invalid-request");
    assert.equal((await app.inject({ method: "GET", url: "/api/news/items/missing-story/timeline", headers })).statusCode, 404);

    const lite = await app.inject({ method: "GET", url: `${url}?analyze=0`, headers });
    assert.equal(lite.statusCode, 200);
    assert.equal(lite.headers["x-ratelimit-remaining"], undefined, "?analyze=0 never calls the model");
    assert.equal(lite.json().data.entries.length, 2);
    assert.equal(completeJson.mock.callCount(), 0);
    assert.equal((await app.inject({ method: "GET", url: `${url}?analyze=yes`, headers })).statusCode, 400);

    const first = await app.inject({ method: "GET", url, headers });
    assert.equal(first.statusCode, 200);
    assert.ok(first.headers["x-ratelimit-remaining"] !== undefined, "the model call counts toward aiRateLimit");
    const data = first.json().data;
    assert.deepEqual(
      data.entries.map((entry: { sourceId: string; tag: string; isNew: boolean }) => [entry.sourceId, entry.tag, entry.isNew]),
      [
        ["a", "first", false],
        ["b", "number", true],
      ],
    );
    assert.deepEqual(data.conflicts[0].values, [
      { sourceId: "a", value: "٢٫٩٪" },
      { sourceId: "b", value: "٣٫١٪" },
    ]);
    assert.equal(data.conflicts[0].safeWording, "حوالي ٣٪");
    assert.deepEqual(data.agreed, [{ text: "تثبيت الفائدة", sourceCount: 2 }]);
    assert.equal(data.confirmedBy, 2);

    const cached = await app.inject({ method: "GET", url, headers });
    assert.equal(cached.statusCode, 200);
    assert.equal(cached.headers["x-ratelimit-remaining"], undefined, "a cached timeline does not spend the AI budget");
    assert.deepEqual(cached.json().data, data);
    assert.equal(completeJson.mock.callCount(), 1);
  } finally {
    await app.close();
    start.mock.restore();
    getItem.mock.restore();
    list.mock.restore();
    completeJson.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
