import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config/index.js";
import { buildApp } from "./app.js";
import { OpenAIClient } from "./ai/openaiClient.js";
import { NewsAggregator } from "./services/newsAggregator.js";
import { EditorialWorkspaceStore } from "./services/editorialWorkspaceStore.js";

// S12 `POST /editorial/conversations/:id/check` through the assembled app. The OpenAI client is never reached:
// first unconfigured (503), then `completeJson` is mocked on the prototype.
test("S12 publish check route keeps auth, validation, the AI rate limit, the cache and its contract", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s12-routes-"));
  const storePath = join(directory, "editorial.sqlite");
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: storePath,
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "s12-editor",
    authSeedPassword: "test-only-password",
  });
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const app = await buildApp();
  app.log.level = "silent";
  try {
    const missing = "8c7d1a2e-4b6f-4c3d-9e8f-0a1b2c3d4e5f";
    const url = (id: string) => `/api/editorial/conversations/${id}/check`;
    assert.equal((await app.inject({ method: "POST", url: url(missing), payload: {} })).statusCode, 401);

    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { identifier: "s12-editor", password: "test-only-password" } });
    const { token, user } = login.json().data;
    const headers = { authorization: `Bearer ${token}` };

    // A social draft written straight to the store the app opened (no AI in tests).
    const side = new EditorialWorkspaceStore(storePath);
    const conversation = side.createConversation({
      title: "خ".repeat(270),
      format: "social",
      language: "ar",
      itemId: "n1",
      sourcePacket: "Headline: المركزي يثبت الفائدة",
      copy: { title: "خ".repeat(270), dek: "", summary: "النص", bullets: ["#البنك_المركزي #أسعار_الفائدة #التضخم"], sources: [], language: "ar", format: "social" },
      createdBy: user.id,
    });
    side.close();

    for (const [id, payload] of [
      ["not-a-uuid", {}],
      [conversation.id, { platform: "linkedin" }],
      [conversation.id, { platform: 3 }],
    ] as const) {
      const response = await app.inject({ method: "POST", url: url(id), headers, payload });
      assert.equal(response.statusCode, 400, JSON.stringify(payload));
      assert.equal(response.json().message, "invalid-request");
    }
    assert.equal((await app.inject({ method: "POST", url: url(missing), headers, payload: {} })).statusCode, 404);

    const unconfigured = await app.inject({ method: "POST", url: url(conversation.id), headers, payload: { platform: "x" } });
    assert.equal(unconfigured.statusCode, 503);
    assert.equal(unconfigured.json().message, "openai-not-configured");
    assert.ok(unconfigured.headers["x-ratelimit-remaining"] !== undefined, "a model call counts toward aiRateLimit");

    const ok = { status: "ok", title: "", note: "مفيش أخطاء", fixLabel: "", fixInstruction: "" };
    const completeJson = mock.method(OpenAIClient.prototype, "completeJson", async (options: Parameters<OpenAIClient["completeJson"]>[0]) =>
      options.parse({ attribution: { ...ok, note: "كل ادعاء منسوب لمصدر" }, numbers: { ...ok, note: "مفيش أرقام" }, language: ok }),
    );
    try {
      const checked = await app.inject({ method: "POST", url: url(conversation.id), headers, payload: { platform: "x" } });
      assert.equal(checked.statusCode, 200);
      assert.ok(checked.headers["x-ratelimit-remaining"] !== undefined);
      const data = checked.json().data;
      assert.equal(data.versionId, conversation.currentVersionId);
      assert.deepEqual(
        data.checks.map((check: { id: string; status: string; title: string }) => [check.id, check.status, check.title]),
        [
          ["attribution", "ok", "الإسناد"],
          ["numbers", "ok", "الأرقام مطابقة للمصادر"],
          ["length:x", "fail", "٣٠٩ من ٢٨٠ حرف"],
          ["instagram-hook", "warn", "الخطاف طويل على إنستجرام"],
          ["language", "ok", "الإملاء والنحو"],
        ],
      );

      // Another platform, then no platform: the version's AI part comes from the cache and is not rate-limited.
      const telegram = await app.inject({ method: "POST", url: url(conversation.id), headers, payload: { platform: "telegram" } });
      assert.equal(telegram.statusCode, 200);
      assert.equal(telegram.headers["x-ratelimit-remaining"], undefined);
      assert.deepEqual(
        telegram.json().data.checks.map((check: { id: string }) => check.id),
        ["attribution", "numbers", "instagram-hook", "language"],
      );
      const bare = await app.inject({ method: "POST", url: url(conversation.id), headers });
      assert.equal(bare.statusCode, 200);
      assert.equal(completeJson.mock.callCount(), 1, "one model call per version");
    } finally {
      completeJson.mock.restore();
    }
  } finally {
    await app.close();
    start.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
