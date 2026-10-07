import assert from "node:assert/strict";
import { test } from "node:test";
import OpenAI from "openai";
import Fastify from "fastify";
import type { AuthService } from "./authService.js";
import { OpenAIUsageService } from "./openaiUsageService.js";
import { createOpenAIUsageRoutes } from "../routes/openaiUsageRoutes.js";
import { requireApiAuthUnlessPublic } from "../middleware/requireAuth.js";
import { jwtPlugin } from "../plugins/jwt.plugin.js";
import { errorHandlerPlugin } from "../plugins/errorHandler.plugin.js";
import { env } from "../config/index.js";
import { openaiUsageQuerySchema } from "../schemas/openaiUsage.schema.js";

const range = { start: "2026-01-01", end: "2026-01-02", project: "proj_test" };
function fixture(handler?: (url: URL) => Response | undefined) {
  const requests: URL[] = [];
  const client = new OpenAI({ adminAPIKey: "fake-admin-test-key", maxRetries: 0, fetch: async (input, init) => {
    const url = new URL(String(input)); requests.push(url);
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer fake-admin-test-key");
    const override = handler?.(url); if (override) return override;
    const send = (body: unknown) => Response.json(body);
    if (url.pathname.endsWith("/spend_limit")) return send({ threshold_amount: 10000, currency: "USD", interval: "month", enforcement: { status: "enforcing" } });
    if (url.pathname.endsWith("/rate_limits")) return send({ object: "list", data: [{ id: "rl_test", model: "test-model", max_requests_per_1_minute: 500, max_tokens_per_1_minute: 20000, max_requests_per_1_day: 4000 }], has_more: false });
    if (url.pathname.endsWith("/projects")) return send({ object: "list", data: [{ id: "proj_test", name: "Newsplus", status: "active" }], has_more: false });
    const start = Number(url.searchParams.get("start_time"));
    if (url.pathname.endsWith("/costs")) {
      const second = url.searchParams.has("page");
      return send({ object: "page", data: [{ start_time: start + (second ? 86400 : 0), results: [{ amount: { value: url.searchParams.has("project_ids[]") ? .25 : 2, currency: "usd" }, line_item: "API", project_id: "proj_test" }] }], has_more: !second, next_page: second ? null : "next" });
    }
    const category = url.pathname.split("/").at(-1);
    const results = category === "completions" ? [{ object: "organization.usage.completions.result", model: "test-model", input_tokens: 1000, output_tokens: 200, input_cached_tokens: 400, num_model_requests: 2, batch: false, service_tier: "default" }] : category === "images" ? [{ model: "test-image", images: 3, num_model_requests: 1, size: "1024x1536", source: "image.generation" }] : [];
    return send({ object: "page", data: [{ start_time: start, results }], has_more: false, next_page: null });
  } });
  return { requests, client };
}

test("missing admin key produces explicit unknowns without upstream requests", async () => {
  const data = await new OpenAIUsageService(null, "").get(range);
  assert.equal(data.configured, false);
  assert.equal(data.costs.status, "not-configured");
  assert.equal(data.costs.data, null);
  assert.equal(data.usage.completions.data, null);
});
test("OpenAI usage handles pagination, real image field, dollars, cents, project scope and cache", async () => {
  const { client, requests } = fixture();
  const service = new OpenAIUsageService(client, "proj_default");
  const [data, same] = await Promise.all([service.get(range), service.get(range)]);
  assert.strictEqual(data, same);
  assert.equal(data.costs.data?.length, 2);
  assert.equal(data.costs.data?.reduce((sum, row) => sum + row.amount, 0), .5);
  assert.equal(data.organizationMonthCosts.data?.reduce((sum, row) => sum + row.amount, 0), 4);
  assert.equal(data.organizationLimit.data?.amount, 100);
  assert.equal(data.projectLimit.data?.amount, 100);
  assert.equal(data.usage.completions.data?.[0].metrics.input_tokens, 1000);
  assert.equal(data.usage.completions.data?.[0].metrics.input_cached_tokens, 400);
  assert.equal(data.usage.completions.data?.[0].dimensions.batch, "false");
  assert.equal(data.usage.images.data?.[0].metrics.images, 3);
  assert.equal(data.usage.images.data?.[0].dimensions.size, "1024x1536");
  assert.equal(data.rateLimits.data?.[0].requestsPerDay, 4000);
  assert.equal(data.rateLimits.data?.[0].imagesPerMinute, null);
  const imageRequest = requests.find((url) => url.pathname.endsWith("/images"))!;
  assert.deepEqual(imageRequest.searchParams.getAll("group_by[]"), ["model", "size", "source"]);
  assert.equal(imageRequest.searchParams.get("end_time"), String(Date.parse("2026-01-03") / 1000));
  const count = requests.length;
  await service.get(range); assert.equal(requests.length, count);
  const organization = await service.get({ ...range, project: "organization" });
  assert.equal(organization.scope.projectId, null);
  assert.equal(organization.rateLimits.status, "project-required");
  assert.equal(organization.costs.data?.[0].amount, 2);
  assert.equal(JSON.stringify(data).includes("fake-admin-test-key"), false);
});
test("partial permissions and missing spend limits do not zero out other data", async () => {
  const { client } = fixture((url) => url.pathname.endsWith("/costs") ? Response.json({ error: { message: "secret upstream detail" } }, { status: 403 }) : url.pathname.endsWith("/spend_limit") ? Response.json({ error: { message: "missing" } }, { status: 404 }) : undefined);
  const data = await new OpenAIUsageService(client).get(range);
  assert.equal(data.costs.status, "unauthorized"); assert.equal(data.costs.data, null);
  assert.equal(data.organizationLimit.status, "not-found");
  assert.equal(data.usage.completions.status, "ready");
  assert.equal(JSON.stringify(data).includes("secret upstream detail"), false);
});
test("broken pagination and upstream failure return unavailable, never incomplete totals", async () => {
  const { client } = fixture((url) => url.pathname.endsWith("/costs") ? Response.json({ data: [], has_more: true, next_page: "loop" }) : url.pathname.endsWith("/images") ? Response.json({ error: { message: "rate limited" } }, { status: 429 }) : undefined);
  const data = await new OpenAIUsageService(client).get(range);
  assert.equal(data.costs.status, "unavailable"); assert.equal(data.costs.data, null);
  assert.equal(data.usage.images.status, "unavailable");
});
test("query dates validate calendar days, inclusive range, future dates and 90-day cap", () => {
  assert.equal(openaiUsageQuerySchema.safeParse(range).success, true);
  for (const query of [{ ...range, start: "2026-02-30" }, { ...range, end: "2025-12-31" }, { ...range, end: "2099-01-01" }, { ...range, end: "2026-04-01" }, { ...range, project: "../project" }, { ...range, extra: "value" }]) assert.equal(openaiUsageQuerySchema.safeParse(query).success, false);
});
test("usage route denies anonymous and ordinary editors, allows owner/admin, validates and disables browser caching", async () => {
  const app = Fastify({ logger: false });
  await app.register(jwtPlugin); await app.register(errorHandlerPlugin);
  const auth = { getUserById: async (id: string) => ({ id, identifier: id === "owner" ? env.authSeedIdentifier : "other-editor", role: id === "admin" ? "admin" : "editor" }) } as unknown as AuthService;
  await app.register(async (api) => {
    api.addHook("onRequest", requireApiAuthUnlessPublic);
    await api.register(createOpenAIUsageRoutes(new OpenAIUsageService(null), auth));
  }, { prefix: "/api" });
  const url = `/api/openai/usage?start=${range.start}&end=${range.end}`;
  try {
    assert.equal((await app.inject(url)).statusCode, 401);
    for (const id of ["editor", "owner", "admin"]) {
      const headers = { authorization: `Bearer ${app.jwt.sign({ sub: id })}` };
      const response = await app.inject({ url, headers });
      assert.equal(response.statusCode, id === "editor" ? 403 : 200);
      if (id !== "editor") {
        assert.equal(response.headers["cache-control"], "no-store");
        assert.equal(response.json().data.configured, false);
        assert.equal((await app.inject({ url: url + "&project=invalid", headers })).statusCode, 400);
      }
    }
  } finally { await app.close(); }
});
