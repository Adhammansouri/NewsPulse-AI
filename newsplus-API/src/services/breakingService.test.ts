import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { breakingJsonSchema } from "../ai/prompts/breakingDigest.js";
import { newsBreakingBodySchema } from "../schemas/breakingDigest.schema.js";
import { OpenAIUpstreamError, ValidationError } from "../utils/errors.js";
import {
  BreakingService,
  breakingAlert,
  breakingPost,
  breakingTicker,
  clip,
  textLength,
  withLead,
} from "./breakingService.js";
import type { NewsAggregator } from "./newsAggregator.js";

const item = {
  id: "story-1",
  title: "البنك المركزي يثبت أسعار الفائدة",
  excerpt: "قررت اللجنة الإبقاء على الأسعار.",
  publishedAt: new Date(0).toISOString(),
  breaking: true,
  topic: "economy" as const,
  sources: [
    { id: "a", name: "Outlet A", url: "https://example.com/a" },
    { id: "b", name: "Outlet B", url: "https://example.com/b" },
  ],
};

type CompleteJsonOptions = Parameters<OpenAIClient["completeJson"]>[0];

function service(output: unknown, calls: CompleteJsonOptions[] = [], clock = [1_000, 4_200]) {
  const openai = {
    async completeJson(options: CompleteJsonOptions) {
      calls.push(options);
      return options.parse(output);
    },
  } as unknown as OpenAIClient;
  const aggregator = { async getItem(id: string) { return id === item.id ? item : null; } } as unknown as NewsAggregator;
  const workspace = { listMemoryRules: () => [] };
  const ticks = [...clock];
  return new BreakingService({ aggregator, openai, workspace, now: () => ticks.shift() ?? 0 });
}

test("breaking returns the three outputs with the model time in ms, from one JSON call on the item", async () => {
  const calls: CompleteJsonOptions[] = [];
  const data = await service(
    { post: "عاجل | المركزي يثبت الفائدة. التفاصيل تتبع. #عاجل #البنك_المركزي", ticker: "عاجل: المركزي يثبت الفائدة", alert: "المركزي يثبت الفائدة. اضغط للتفاصيل" },
    calls,
  ).breaking(item.id, "editor-1");
  assert.deepEqual(data, {
    post: "عاجل | المركزي يثبت الفائدة. التفاصيل تتبع. #عاجل #البنك_المركزي",
    ticker: "عاجل: المركزي يثبت الفائدة",
    alert: "المركزي يثبت الفائدة. اضغط للتفاصيل",
    ms: 3_200,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].schemaName, "breaking_outputs");
  assert.equal(calls[0].schema, breakingJsonSchema);
  assert.equal(calls[0].userId, "editor-1");
  assert.match(calls[0].input, /Headline: البنك المركزي يثبت أسعار الفائدة/);
  assert.match(calls[0].input, /Outlets: Outlet A, Outlet B/);
});

test("breaking rejects an unknown item before any model call", async () => {
  const calls: CompleteJsonOptions[] = [];
  await assert.rejects(service({}, calls).breaking("missing-item", "editor-1"), ValidationError);
  assert.equal(calls.length, 0);
});

test("breaking refuses empty outputs instead of returning bare leads", async () => {
  await assert.rejects(service({ post: "عاجل |", ticker: "عاجل: خبر", alert: "خبر" }).breaking(item.id, "editor-1"), OpenAIUpstreamError);
  await assert.rejects(service({ post: "خبر", ticker: "  ", alert: "خبر" }).breaking(item.id, "editor-1"), OpenAIUpstreamError);
});

test("the post and ticker always start with their exact lead", () => {
  assert.equal(withLead("عاجل: خبر", "عاجل |"), "عاجل | خبر");
  assert.equal(withLead("🚨 عاجل - خبر", "عاجل |"), "عاجل | خبر");
  assert.equal(breakingPost("المركزي يثبت الفائدة"), "عاجل | المركزي يثبت الفائدة");
  assert.equal(breakingPost("عاجل|المركزي يثبت الفائدة"), "عاجل | المركزي يثبت الفائدة");
  assert.equal(breakingTicker("عاجل | المركزي يثبت الفائدة"), "عاجل: المركزي يثبت الفائدة");
  assert.equal(breakingTicker("المركزي\nيثبت الفائدة"), "عاجل: المركزي يثبت الفائدة", "one line");
});

test("the post stays within 280 characters and keeps its trailing hashtags whole", () => {
  const long = `عاجل | ${"كلمة ".repeat(80)}#عاجل #البنك_المركزي`;
  const post = breakingPost(long);
  assert.ok(textLength(post) <= 280, `${textLength(post)} > 280`);
  assert.ok(post.startsWith("عاجل | "));
  assert.ok(post.endsWith("… #عاجل #البنك_المركزي"), post);
  // Without hashtags the body alone is clipped.
  const plain = breakingPost(`عاجل | ${"كلمة ".repeat(80)}`);
  assert.ok(textLength(plain) <= 280);
  assert.ok(plain.endsWith("…"));
  // A post already within the limit is untouched.
  assert.equal(breakingPost("عاجل | خبر قصير #عاجل"), "عاجل | خبر قصير #عاجل");
});

test("hashtags give way when they leave no room for the news", () => {
  const tags = Array.from({ length: 30 }, (_, index) => `#وسم_طويل_${index}`).join(" ");
  const post = breakingPost(`عاجل | المركزي يثبت الفائدة ${tags}`);
  assert.ok(textLength(post) <= 280);
  assert.ok(post.startsWith("عاجل | المركزي يثبت الفائدة"));
});

test("the alert is one line of at most 80 characters", () => {
  const alert = breakingAlert(`المركزي يثبت الفائدة للمرة الثالثة على التوالي\n${"والأسواق تترقب ".repeat(6)}`);
  assert.ok(textLength(alert) <= 80, `${textLength(alert)} > 80`);
  assert.ok(!alert.includes("\n"));
  assert.ok(alert.endsWith("…"));
  assert.equal(breakingAlert("تنبيه قصير"), "تنبيه قصير");
});

test("clip counts code points, so emoji never split", () => {
  const text = "😀".repeat(100);
  const clipped = clip(text, 80);
  assert.equal(textLength(clipped), 80);
  assert.ok(Array.from(clipped).slice(0, -1).every((char) => char === "😀"));
});

test("breaking body requires an item id shaped like the feed's", () => {
  assert.ok(newsBreakingBodySchema.safeParse({ itemId: "story-1" }).success);
  for (const body of [{}, { itemId: "" }, { itemId: "abc" }, { itemId: "x".repeat(65) }, { itemId: 42 }]) {
    assert.equal(newsBreakingBodySchema.safeParse(body).success, false, JSON.stringify(body));
  }
});
