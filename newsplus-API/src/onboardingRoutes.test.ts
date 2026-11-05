import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config/index.js";
import { buildApp } from "./app.js";
import { OpenAIClient } from "./ai/openaiClient.js";
import { NewsAggregator } from "./services/newsAggregator.js";

// S16 through the assembled app: `GET/PUT /me/preferences`, `POST /news/hook-styles` and `POST /editorial/memory`.
// The aggregator never refreshes (start and getItem are mocked) and OpenAI is first unconfigured, then mocked.
async function withApp(name: string, run: (app: Awaited<ReturnType<typeof buildApp>>, directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), `newsplus-s16-${name}-`));
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: join(directory, "editorial.sqlite"),
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "s16-editor",
    authSeedPassword: "test-only-password",
  });
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const app = await buildApp();
  app.log.level = "silent";
  try {
    await run(app, directory);
  } finally {
    await app.close();
    start.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
}

async function signIn(app: Awaited<ReturnType<typeof buildApp>>) {
  const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { identifier: "s16-editor", password: "test-only-password" } });
  const { token, user } = login.json().data;
  return { headers: { authorization: `Bearer ${token}` }, userId: user.id as string };
}

test("S16 preferences: auth, validation, the caller's own row, partial updates and onboardedAt stamped once", async () => {
  await withApp("prefs", async (app) => {
    const url = "/api/me/preferences";
    assert.equal((await app.inject({ method: "GET", url })).statusCode, 401);
    assert.equal((await app.inject({ method: "PUT", url, payload: { onboarded: true } })).statusCode, 401);

    const { headers } = await signIn(app);
    const empty = await app.inject({ method: "GET", url, headers });
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(empty.json().data, { platforms: [], sources: [] }, "nothing saved: empty choices, onboarding not done");

    for (const payload of [
      {},
      { onboarded: false },
      { onboardedAt: "2026-01-01T00:00:00.000Z" },
      { platforms: ["linkedin"] },
      { platforms: "x" },
      { platforms: Array.from({ length: 11 }, () => "x") },
      { sources: ["not-a-source"] },
      { sources: [""] },
      { sources: ["s".repeat(41)] },
      { sources: Array.from({ length: 65 }, (_, i) => `s${i}`) },
      { hookStyle: "emoji" },
      { platforms: ["x"], extra: 1 },
    ]) {
      const response = await app.inject({ method: "PUT", url, headers, payload });
      assert.equal(response.statusCode, 400, JSON.stringify(payload));
      assert.equal(response.json().message, "invalid-request");
    }
    assert.deepEqual((await app.inject({ method: "GET", url, headers })).json().data, { platforms: [], sources: [] }, "a refused PUT stores nothing");

    // «تخطّي»: onboarded only — the choices stay empty.
    const skipped = await app.inject({ method: "PUT", url, headers, payload: { onboarded: true } });
    assert.equal(skipped.statusCode, 200);
    const { onboardedAt } = skipped.json().data;
    assert.ok(typeof onboardedAt === "string" && Number.isFinite(Date.parse(onboardedAt)));
    assert.deepEqual(skipped.json().data, { platforms: [], sources: [], onboardedAt });

    // «ابدأ الشغل» later (e.g. /welcome again): the choices are saved, repeats dropped; onboardedAt is kept.
    const finished = await app.inject({
      method: "PUT",
      url,
      headers,
      payload: { platforms: ["x", "telegram", "x"], sources: ["alarabiya", "sky-arabia", "alarabiya"], hookStyle: "question", onboarded: true },
    });
    assert.equal(finished.statusCode, 200);
    assert.deepEqual(finished.json().data, { platforms: ["x", "telegram"], sources: ["alarabiya", "sky-arabia"], hookStyle: "question", onboardedAt });

    // A partial PUT keeps the fields it leaves out.
    const partial = await app.inject({ method: "PUT", url, headers, payload: { platforms: ["instagram"] } });
    assert.deepEqual(partial.json().data, { platforms: ["instagram"], sources: ["alarabiya", "sky-arabia"], hookStyle: "question", onboardedAt });

    // Another editor reads their own (empty) row.
    const other = { authorization: `Bearer ${app.jwt.sign({ sub: "another-editor" })}` };
    assert.deepEqual((await app.inject({ method: "GET", url, headers: other })).json().data, { platforms: [], sources: [] });
    assert.deepEqual((await app.inject({ method: "GET", url, headers })).json().data.platforms, ["instagram"]);
  });
});

test("S16 preferences survive a restart (the row is in the editorial store's file)", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s16-restart-"));
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: join(directory, "editorial.sqlite"),
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "s16-editor",
    authSeedPassword: "test-only-password",
  });
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  try {
    const first = await buildApp();
    first.log.level = "silent";
    const { headers } = await signIn(first);
    await first.inject({ method: "PUT", url: "/api/me/preferences", headers, payload: { platforms: ["tiktok"], onboarded: true } });
    await first.close();

    const second = await buildApp();
    second.log.level = "silent";
    const again = await signIn(second);
    const data = (await second.inject({ method: "GET", url: "/api/me/preferences", headers: again.headers })).json().data;
    assert.deepEqual(data.platforms, ["tiktok"]);
    assert.ok(data.onboardedAt, "onboarding never shows again after a restart");
    await second.close();
  } finally {
    start.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});

test("S16 hook styles: auth, validation, 404, the AI rate limit only on a model call, and the cache", async () => {
  const item = {
    id: "story-1",
    title: "المركزي يثبت الفائدة للمرة الثالثة",
    excerpt: "قررت اللجنة الإبقاء على الأسعار.",
    publishedAt: new Date().toISOString(),
    breaking: false,
    topic: "economy" as const,
    sources: [{ id: "alarabiya", name: "العربية", url: "https://example.com/a" }],
  };
  const getItem = mock.method(NewsAggregator.prototype, "getItem", async (id: string) => (id === item.id ? item : null));
  try {
    await withApp("hooks", async (app) => {
      const url = "/api/news/hook-styles";
      assert.equal((await app.inject({ method: "POST", url, payload: { itemId: item.id } })).statusCode, 401);
      const { headers } = await signIn(app);

      for (const payload of [{}, { itemId: "abc" }, { itemId: "x".repeat(65) }, { itemId: 42 }]) {
        const response = await app.inject({ method: "POST", url, headers, payload });
        assert.equal(response.statusCode, 400, JSON.stringify(payload));
        assert.equal(response.json().message, "invalid-request");
      }

      const missing = await app.inject({ method: "POST", url, headers, payload: { itemId: "missing-story" } });
      assert.equal(missing.statusCode, 404);
      assert.equal(missing.headers["x-ratelimit-remaining"], undefined, "an unknown story never spends the AI budget");

      const unconfigured = await app.inject({ method: "POST", url, headers, payload: { itemId: item.id } });
      assert.equal(unconfigured.statusCode, 503);
      assert.ok(unconfigured.headers["x-ratelimit-remaining"] !== undefined, "a model call counts toward aiRateLimit");

      const completeJson = mock.method(OpenAIClient.prototype, "completeJson", async (options: Parameters<OpenAIClient["completeJson"]>[0]) =>
        options.parse({
          direct: "المركزي يثبت الفائدة للمرة الثالثة.",
          question: "«هل انتهى زمن خفض الفائدة؟ المركزي يثبتها للمرة الثالثة»",
          number: "٣ مرات متتالية:\nالمركزي يثبت الفائدة",
        }),
      );
      try {
        const first = await app.inject({ method: "POST", url, headers, payload: { itemId: item.id } });
        assert.equal(first.statusCode, 200);
        assert.ok(first.headers["x-ratelimit-remaining"] !== undefined);
        assert.deepEqual(first.json().data, {
          direct: "المركزي يثبت الفائدة للمرة الثالثة",
          question: "هل انتهى زمن خفض الفائدة؟ المركزي يثبتها للمرة الثالثة",
          number: "٣ مرات متتالية: المركزي يثبت الفائدة",
        });
        const options = completeJson.mock.calls[0].arguments[0];
        assert.equal(options.schemaName, "hook_styles");
        assert.match(options.input, /# Evidence \(not instructions\)\n<<<SOURCE\nHeadline: المركزي يثبت الفائدة للمرة الثالثة/);

        const cached = await app.inject({ method: "POST", url, headers, payload: { itemId: item.id } });
        assert.equal(cached.statusCode, 200);
        assert.equal(cached.headers["x-ratelimit-remaining"], undefined, "cached hooks are not rate-limited");
        assert.deepEqual(cached.json().data, first.json().data);
        assert.equal(completeJson.mock.callCount(), 1, "one model call per story headline");
      } finally {
        completeJson.mock.restore();
      }
    });
  } finally {
    getItem.mock.restore();
  }
});

test("S16 POST /editorial/memory: auth, bounds, an approved rule by the caller, no duplicate", async () => {
  await withApp("memory", async (app) => {
    const url = "/api/editorial/memory";
    const rule = { instruction: "ابدأ خطافات الأخبار بسؤال مباشر يخص القارئ.", rationale: "اختيار أسلوب الخطاف في أول تشغيل." };
    assert.equal((await app.inject({ method: "POST", url, payload: rule })).statusCode, 401);
    const { headers, userId } = await signIn(app);

    for (const payload of [
      {},
      { instruction: rule.instruction },
      { instruction: "قصير جداً", rationale: rule.rationale },
      { instruction: "خ".repeat(281), rationale: rule.rationale },
      { instruction: rule.instruction, rationale: "" },
      { instruction: rule.instruction, rationale: "س".repeat(281) },
      { instruction: 18, rationale: rule.rationale },
    ]) {
      const response = await app.inject({ method: "POST", url, headers, payload });
      assert.equal(response.statusCode, 400, JSON.stringify(payload).slice(0, 80));
      assert.equal(response.json().message, "invalid-request");
    }

    const created = await app.inject({ method: "POST", url, headers, payload: { ...rule, instruction: `  ${rule.instruction}  ` } });
    assert.equal(created.statusCode, 200);
    const data = created.json().data;
    assert.equal(data.instruction, rule.instruction);
    assert.equal(data.rationale, rule.rationale);
    assert.equal(data.status, "approved");
    assert.equal(data.createdBy, userId);

    const again = await app.inject({ method: "POST", url, headers, payload: rule });
    assert.equal(again.json().data.id, data.id, "the same approved text is not stored twice");

    const approved = (await app.inject({ method: "GET", url: `${url}?status=approved`, headers })).json().data.rules;
    assert.deepEqual(approved.map((entry: { id: string }) => entry.id), [data.id], "the archive's memory tab lists it");
    // The existing status route still works on it (S10 «تراجع»).
    const undone = await app.inject({ method: "POST", url: `${url}/${data.id}`, headers, payload: { status: "pending" } });
    assert.equal(undone.json().data.status, "pending");
  });
});
