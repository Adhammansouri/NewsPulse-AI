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
  const drafts = await vite.ssrLoadModule("/src/modules/Generate/generateDesk.ts");
  const { default: GeneratePage } = await vite.ssrLoadModule("/src/modules/Generate/pages/GeneratePage.tsx");
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

  await test("authenticated 401 responses clear expired sessions for JSON and assets", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "fail", message: "unauthorized" }), { status: 401 });
    for (const request of [() => http.apiRequest("/auth/me", { auth: true }), () => http.apiBlob("/news/carousel/test/asset")]) {
      sessions.saveSession({ token: "expired-token", user }, false);
      await assert.rejects(request());
      assert.equal(sessions.getAccessToken(), null);
    }
  });

  await test("temporary server errors preserve the session", async () => {
    sessions.saveSession({ token: "valid-token", user }, false);
    globalThis.fetch = async () => new Response("upstream unavailable", { status: 503 });
    await assert.rejects(http.apiRequest("/auth/me", { auth: true }));
    assert.equal(sessions.getAccessToken(), "valid-token");
    sessions.clearSession();
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

  await test("corrupted saved drafts are excluded before they can crash the generation page", () => {
    sessionStorage.setItem("newsplus-generate-drafts", JSON.stringify([null, {}, { id: "bad", title: {} }]));
    assert.deepEqual(drafts.readDrafts(), []);
    sessionStorage.clear();
  });

  await test("handoff separates a source URL from following assignment notes", () => {
    assert.deepEqual(drafts.splitHandoff("https://example.com/report\n\nWrite a short report."), { url: "https://example.com/report", notes: "Write a short report." });
    assert.equal(drafts.urlLooksBroken("publisher"), true);
    assert.equal(drafts.urlLooksBroken("ftp://example.com/report"), true);
    assert.equal(drafts.urlLooksBroken("https://example.com/report"), false);
  });

  await test("generation blocks assignments outside the API limits and accepts URL plus notes", () => {
    for (const [prompt, blocked] of [["ab", true], ["x".repeat(12_001), true], ["https://example.com/report\n\nWrite a short report.", false]]) {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
      try {
        const html = renderToStaticMarkup(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: [{ pathname: "/generate", state: { prompt } }] }, h(GeneratePage))));
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
