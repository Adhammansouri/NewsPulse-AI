import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { corsPlugin } from "./cors.plugin.js";
import { errorHandlerPlugin } from "./errorHandler.plugin.js";
import { env } from "../config/index.js";

test("API routes registered beside the CORS plugin expose headers on success and failure", async () => {
  const app = Fastify();
  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  app.get("/api/probe", async () => ({ status: "success" }));
  app.post("/api/probe", async (request) => request.body);
  try {
    const response = await app.inject({ url: "/api/probe", headers: { origin: env.corsOrigin } });
    assert.equal(response.headers["access-control-allow-origin"], env.corsOrigin);
    assert.match(String(response.headers["cache-control"]), /no-store/);
    const bad = await app.inject({ method: "POST", url: "/api/probe", headers: { origin: env.corsOrigin, "content-type": "application/json" }, payload: "{" });
    assert.equal(bad.headers["access-control-allow-origin"], env.corsOrigin);
    assert.equal(bad.statusCode, 400);
  } finally { await app.close(); }
});

test("cross-origin memory updates accept POST preflight", async () => {
  const app = Fastify();
  await app.register(corsPlugin);
  app.post("/api/editorial/memory/probe", async () => ({ status: "success" }));
  try {
    const response = await app.inject({ method: "OPTIONS", url: "/api/editorial/memory/probe", headers: { origin: env.corsOrigin, "access-control-request-method": "POST", "access-control-request-headers": "authorization,content-type" } });
    assert.equal(response.statusCode, 204);
    assert.match(String(response.headers["access-control-allow-methods"]), /POST/);
  } finally { await app.close(); }
});

test("malformed JSON, unsupported media and oversized bodies retain client error status", async () => {
  const app = Fastify({ bodyLimit: 64 });
  await app.register(errorHandlerPlugin);
  app.post("/api/probe", async (request) => request.body);
  try {
    for (const [type, payload, status] of [["application/json", "{", 400], ["application/unknown", "x", 415], ["application/json", JSON.stringify({ value: "x".repeat(100) }), 413]] as const) {
      const response = await app.inject({ method: "POST", url: "/api/probe", headers: { "content-type": type }, payload });
      assert.equal(response.statusCode, status);
      assert.deepEqual(response.json(), { status: "fail", message: "invalid-request" });
    }
  } finally { await app.close(); }
});
