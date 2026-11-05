// Exercise browser service contracts with controlled storage and HTTP responses.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear() };
};
const blockedStorage = { getItem() { throw new Error("Storage unavailable"); }, setItem() { throw new Error("Storage unavailable"); }, removeItem() { throw new Error("Storage unavailable"); } };
const originalFetch = globalThis.fetch;
globalThis.window = new EventTarget();
globalThis.localStorage = memoryStorage();
globalThis.sessionStorage = memoryStorage();
const user = { id: "editor-1", identifier: "editor", displayName: "Editor", role: "editor" };

try {
  const sessions = await vite.ssrLoadModule("/src/services/sessionStore.ts");
  const http = await vite.ssrLoadModule("/src/services/httpConfig.ts");
  const cooldown = await vite.ssrLoadModule("/src/services/aiCooldown.ts");
  const unsent = await vite.ssrLoadModule("/src/services/unsentDrafts.ts");
  const drafts = await vite.ssrLoadModule("/src/modules/Generate/generateDesk.ts");
  const { default: GeneratePage } = await vite.ssrLoadModule("/src/modules/Generate/pages/GeneratePage.tsx");
  const { ToastProvider } = await vite.ssrLoadModule("/src/ui/Toast.tsx");
  const translate = await vite.ssrLoadModule("/src/modules/Translate/translateDesk.ts");
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
    globalThis.fetch = originalFetch;
    sessions.clearSession();
  });

  await test("blocked local storage still permits tab sessions and logout", () => {
    globalThis.localStorage = blockedStorage;
    globalThis.sessionStorage = memoryStorage();
    sessions.saveSession({ token: "tab-token", user }, false);
    assert.equal(sessions.getAccessToken(), "tab-token");
    sessions.clearSession();
    assert.equal(sessions.getSession(), null);
    assert.equal(sessionStorage.getItem("newsplus-session"), null);
    globalThis.localStorage = memoryStorage();
  });

  await test("authentication works in memory when both storage APIs are unavailable", () => {
    globalThis.localStorage = blockedStorage;
    globalThis.sessionStorage = blockedStorage;
    sessions.saveSession({ token: "memory-token", user }, true);
    assert.equal(sessions.getAccessToken(), "memory-token");
    sessions.clearSession();
    assert.equal(sessions.getSession(), null);
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
  });

  await test("authenticated 401 responses mark the session expired for JSON and assets until the user signs in again", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "fail", message: "unauthorized" }), { status: 401 });
    for (const request of [() => http.apiRequest("/auth/me", { auth: true }), () => http.apiBlob("/news/carousel/test/asset")]) {
      sessions.saveSession({ token: "expired-token", user }, false);
      assert.equal(sessions.isSessionExpired(), false);
      await assert.rejects(request());
      // S10: the screen stays behind «الجلسة انتهت»; «سجّل الدخول» ends the session.
      assert.equal(sessions.isSessionExpired(), true);
      assert.equal(sessions.getAccessToken(), "expired-token");
      sessions.clearSession();
      assert.equal(sessions.isSessionExpired(), false);
      assert.equal(sessions.getAccessToken(), null);
    }
    // A new login (here or in another tab) is a new token: no longer expired.
    sessions.saveSession({ token: "expired-token", user }, false);
    await assert.rejects(http.apiRequest("/auth/me", { auth: true }));
    sessions.saveSession({ token: "fresh-token", user }, false);
    assert.equal(sessions.isSessionExpired(), false);
  });

  await test("the login request itself never expires a session", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "fail", message: "invalid-credentials" }), { status: 401 });
    sessions.saveSession({ token: "kept-token", user }, false);
    await assert.rejects(http.apiRequest("/auth/login", { method: "POST" }));
    assert.equal(sessions.isSessionExpired(), false);
    assert.equal(sessions.getAccessToken(), "kept-token");
  });

  await test("a 429 from an AI route starts the AI cooldown from Retry-After; other 429s don't", async () => {
    cooldown.clearAiCooldown();
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "fail", message: "too-many-requests" }), { status: 429, headers: { "Retry-After": "90", "X-RateLimit-Remaining": "0" } });
    await assert.rejects(http.apiRequest("/auth/login", { method: "POST" }));
    assert.equal(cooldown.getAiCooldown(), null);
    sessions.saveSession({ token: "ai-token", user }, false);
    await assert.rejects(http.apiRequest("/generate", { method: "POST", auth: true }));
    assert.equal(cooldown.getAiCooldown(), null);
    await assert.rejects(http.apiRequest("/generate", { method: "POST", auth: true, ai: true }));
    assert.deepEqual(cooldown.getAiCooldown(), { remaining: 90, total: 90 });
    // A shorter answer never cuts the running cooldown short.
    cooldown.startAiCooldown(10);
    assert.equal(cooldown.getAiCooldown()?.remaining, 90);
    cooldown.clearAiCooldown();
    assert.equal(cooldown.getAiCooldown(), null);
  });

  await test("unsent work is kept for the login and restored once", () => {
    const stop = unsent.registerUnsentDraft("editorial", () => ({ conversationId: "c1", instruction: "اختصر الخطاف" }));
    const empty = unsent.registerUnsentDraft("generate", () => null);
    sessionStorage.setItem("newsplus-unsent:generate", "{\"url\":\"stale\"}");
    unsent.saveUnsentDrafts();
    stop();
    empty();
    assert.equal(unsent.readUnsentDraft("generate"), null);
    assert.deepEqual(unsent.takeUnsentDraft("editorial"), { conversationId: "c1", instruction: "اختصر الخطاف" });
    assert.equal(unsent.takeUnsentDraft("editorial"), null);
  });

  await test("temporary server errors preserve the session", async () => {
    sessions.saveSession({ token: "valid-token", user }, false);
    globalThis.fetch = async () => new Response("upstream unavailable", { status: 503 });
    await assert.rejects(http.apiRequest("/auth/me", { auth: true }));
    assert.equal(sessions.getAccessToken(), "valid-token");
    sessions.clearSession();
  });

  await test("error responses expose Retry-After and X-RateLimit-Remaining on ApiError", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "fail", message: "too-many-requests" }), { status: 429, headers: { "Retry-After": "45", "X-RateLimit-Remaining": "0" } });
    for (const request of [() => http.apiRequest("/auth/login", { method: "POST" }), () => http.apiBlob("/news/carousel/test/asset")]) {
      const error = await request().then(() => null, (reason) => reason);
      assert.equal(error?.status, 429);
      assert.equal(error.code, "too-many-requests");
      assert.equal(error.retryAfterSeconds, 45);
      assert.equal(error.rateLimitRemaining, 0);
    }

    const retryAt = new Date(Date.now() + 90_000).toUTCString();
    globalThis.fetch = async () => new Response("{}", { status: 429, headers: { "Retry-After": retryAt } });
    const dated = await http.apiRequest("/auth/login").then(() => null, (reason) => reason);
    assert.ok(dated.retryAfterSeconds >= 88 && dated.retryAfterSeconds <= 90, `HTTP-date Retry-After → ${dated.retryAfterSeconds}s`);
    assert.equal(dated.rateLimitRemaining, undefined);

    globalThis.fetch = async () => new Response("{}", { status: 401, headers: { "Retry-After": "soon", "X-RateLimit-Remaining": "-1" } });
    const malformed = await http.apiRequest("/auth/login").then(() => null, (reason) => reason);
    assert.equal(malformed.status, 401);
    assert.equal(malformed.retryAfterSeconds, undefined);
    assert.equal(malformed.rateLimitRemaining, undefined);
  });

  await test("late unauthorized requests cannot clear a newer login", async () => {
    sessions.saveSession({ token: "old-token", user }, false);
    let respond;
    globalThis.fetch = () => new Promise((done) => { respond = done; });
    const request = http.apiRequest("/auth/me", { auth: true });
    sessions.saveSession({ token: "new-token", user }, false);
    respond(new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 }));
    await assert.rejects(request);
    assert.equal(sessions.getAccessToken(), "new-token");
    assert.equal(sessions.isSessionExpired(), false);
    sessions.clearSession();
  });

  await test("Headers objects preserve caller headers and bearer authorization", async () => {
    sessions.saveSession({ token: "valid-token", user }, false);
    globalThis.fetch = async (_url, options) => {
      const headers = new Headers(options.headers);
      assert.equal(headers.get("X-Trace"), "probe");
      assert.equal(headers.get("Authorization"), "Bearer valid-token");
      return new Response(JSON.stringify({ status: "success", data: {} }));
    };
    await http.apiRequest("/probe", { auth: true, headers: new Headers({ "X-Trace": "probe" }) });
    sessions.clearSession();
  });

  const draftBody = (title, at) => ({ id: `draft-${at}`, at, title, dek: "dek", body: "body", language: "ar", style: "brief", source: "https://example.com/report" });

  await test("corrupted saved drafts are excluded before they can crash the generation page", () => {
    localStorage.setItem("newsplus-generate-drafts", JSON.stringify([null, {}, { id: "bad", title: {} }]));
    assert.deepEqual(drafts.readDrafts(), []);
    localStorage.setItem("newsplus-generate-drafts", "{not json");
    assert.deepEqual(drafts.readDrafts(), []);
  });

  await test("drafts outlive the tab in local storage, newest first, capped at the last 20", () => {
    for (let index = 1; index <= drafts.DRAFTS_MAX + 5; index += 1) {
      drafts.pushDraft({ title: `draft ${index}`, dek: "dek", body: "body", language: "ar", style: "brief", source: "notes" });
    }
    const saved = JSON.parse(localStorage.getItem("newsplus-generate-drafts"));
    assert.equal(saved.length, drafts.DRAFTS_MAX);
    assert.equal(saved[0].title, `draft ${drafts.DRAFTS_MAX + 5}`);
    assert.equal(saved.at(-1).title, "draft 6");
    assert.equal(sessionStorage.getItem("newsplus-generate-drafts"), null);
    drafts.pushDraft({ title: "draft 10", dek: "new dek", body: "body", language: "ar", style: "article", source: "notes" });
    const reread = drafts.readDrafts();
    assert.equal(reread.length, drafts.DRAFTS_MAX);
    assert.equal(reread[0].dek, "new dek");
    assert.equal(reread.filter((draft) => draft.title === "draft 10").length, 1);
    assert.equal(drafts.deleteDraft(reread[0].id).some((draft) => draft.id === reread[0].id), false);
    assert.equal(drafts.readDrafts().length, drafts.DRAFTS_MAX - 1);
    assert.deepEqual(drafts.clearDrafts(), []);
    assert.deepEqual(drafts.readDrafts(), []);
  });

  await test("tab drafts from session storage move to local storage once, merged newest first", () => {
    localStorage.setItem("newsplus-generate-drafts", JSON.stringify([draftBody("saved", 20)]));
    sessionStorage.setItem("newsplus-generate-drafts", JSON.stringify([draftBody("tab newer", 30), draftBody("tab older", 10), { id: "bad" }]));
    assert.deepEqual(drafts.readDrafts().map((draft) => draft.title), ["tab newer", "saved", "tab older"]);
    assert.equal(sessionStorage.getItem("newsplus-generate-drafts"), null);
    drafts.deleteDraft("draft-30");
    assert.deepEqual(drafts.readDrafts().map((draft) => draft.title), ["saved", "tab older"]);

    globalThis.localStorage = blockedStorage;
    sessionStorage.setItem("newsplus-generate-drafts", JSON.stringify([draftBody("kept in tab", 40)]));
    assert.deepEqual(drafts.readDrafts(), []);
    assert.notEqual(sessionStorage.getItem("newsplus-generate-drafts"), null);
    globalThis.localStorage = memoryStorage();
    assert.deepEqual(drafts.readDrafts().map((draft) => draft.title), ["kept in tab"]);
  });

  await test("handoff separates a source URL from following assignment notes", () => {
    assert.deepEqual(drafts.splitHandoff("https://example.com/report\n\nWrite a short report."), { url: "https://example.com/report", notes: "Write a short report." });
    assert.equal(drafts.urlLooksBroken("publisher"), true);
    assert.equal(drafts.urlLooksBroken("ftp://example.com/report"), true);
    assert.equal(drafts.urlLooksBroken("https://example.com/report"), false);
  });

  await test("translation detects the source language by its share of Arabic letters", () => {
    assert.equal(translate.detectLanguage("وزير المالية يعلن موازنة 2026 الجديدة"), "ar");
    assert.equal(translate.detectLanguage("The finance minister announced the 2026 budget"), "en");
    assert.equal(translate.detectLanguage("Reuters: OPEC+ keeps output steady, says مصدر"), "en");
    assert.equal(translate.detectLanguage("قالت وكالة Reuters إن أوبك+ أبقت الإنتاج"), "ar");
    assert.equal(translate.detectLanguage("2026 — 15%"), null);
    assert.equal(translate.otherLanguage("ar"), "en");
    assert.equal(translate.otherLanguage("en"), "ar");
  });

  await test("generation blocks assignments outside the API limits and accepts URL plus notes", () => {
    for (const [prompt, blocked] of [["ab", true], ["x".repeat(12_001), true], ["https://example.com/report\n\nWrite a short report.", false]]) {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
      try {
        const html = renderToStaticMarkup(h(QueryClientProvider, { client }, h(ToastProvider, null, h(MemoryRouter, { initialEntries: [{ pathname: "/generate", state: { prompt } }] }, h(GeneratePage)))));
        const submit = html.match(/<button type="submit"[^>]*>/)?.[0];
        assert.ok(submit);
        assert.equal(submit.includes("disabled"), blocked);
      } finally { client.clear(); }
    }
  });
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
  await vite.close();
}
