import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { digestJsonSchema } from "../ai/prompts/breakingDigest.js";
import { newsDigestBodySchema } from "../schemas/breakingDigest.schema.js";
import { OpenAIUpstreamError } from "../utils/errors.js";
import { DIGEST_CACHE_MAX, DIGEST_CACHE_TTL_MS, DigestCache, DigestService, sinceHour } from "./digestService.js";
import type { NewsAggregator } from "./newsAggregator.js";

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const T0 = Date.UTC(2026, 10, 4, 23, 0, 0);

const story = (id: string, at: number, sources = 1) => ({
  id,
  title: `Story ${id}`,
  excerpt: "",
  publishedAt: new Date(at).toISOString(),
  breaking: false,
  topic: "economy" as const,
  sources: Array.from({ length: sources }, (_, index) => ({ id: `s${index}`, name: `S${index}`, url: `https://example.com/${id}/${index}` })),
});

const feedItems = [
  story("new-a", T0 + 7 * HOUR, 4),
  story("new-b", T0 + 6 * HOUR, 3),
  story("new-c", T0 + 2 * HOUR, 2),
  story("new-d", T0 + 30 * MIN, 1),
  story("old-a", T0 - 10 * MIN, 5),
];

type CompleteJsonOptions = Parameters<OpenAIClient["completeJson"]>[0];

function setup(output: unknown = { items: [{ itemId: "new-a", reason: "الأهم اقتصادياً." }, { itemId: "new-b", reason: "الأكثر تحديثاً" }, { itemId: "new-c", reason: "متوقع يتفاعل عليه الجمهور" }], summaryText: "1. **أ**\n2. ب\n3. ج" }) {
  const calls: CompleteJsonOptions[] = [];
  const clock = { now: T0 + 8 * HOUR };
  let release: (() => void) | null = null;
  const gate = { hold: false };
  const openai = {
    async completeJson(options: CompleteJsonOptions) {
      calls.push(options);
      if (gate.hold) await new Promise<void>((resolve) => (release = resolve));
      return options.parse(typeof output === "function" ? (output as () => unknown)() : output);
    },
  } as unknown as OpenAIClient;
  let items = feedItems;
  const aggregator = { async getFeed() { return { fetchedAt: new Date(clock.now).toISOString(), items }; } } as unknown as NewsAggregator;
  const digest = new DigestService({ aggregator, openai, now: () => clock.now });
  return { digest, calls, clock, gate, release: () => release?.(), setItems: (next: typeof feedItems) => (items = next) };
}

test("digest picks the model's top three from the stories since the floored hour, titles from the feed", async () => {
  const { digest, calls } = setup();
  const data = await digest.digest(new Date(T0 + 25 * MIN).toISOString(), "editor-1");
  assert.deepEqual(data, {
    items: [
      { itemId: "new-a", title: "Story new-a", reason: "الأهم اقتصادياً" },
      { itemId: "new-b", title: "Story new-b", reason: "الأكثر تحديثاً" },
      { itemId: "new-c", title: "Story new-c", reason: "متوقع يتفاعل عليه الجمهور" },
    ],
    summaryText: "1. أ\n2. ب\n3. ج",
    sourceCount: 4,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].schemaName, "news_digest");
  assert.equal(calls[0].schema, digestJsonSchema);
  // 23:25 floors to 23:00: «new-d» (23:30) is in, «old-a» (22:50) is not; widest coverage first.
  const listed = [...calls[0].input.matchAll(/^(\S+) \| (\d) outlets/gm)].map((match) => match[1]);
  assert.deepEqual(listed, ["new-a", "new-b", "new-c", "new-d"]);
});

test("digest drops unknown and repeated ids, keeps at most three, and fails when none is left", async () => {
  const { digest } = setup({
    items: [
      { itemId: "made-up", reason: "x" },
      { itemId: "new-b", reason: "أ" },
      { itemId: "new-b", reason: "ب" },
      { itemId: "old-a", reason: "قبل الزيارة" },
      { itemId: "new-d", reason: "ج" },
      { itemId: "new-a", reason: "د" },
      { itemId: "new-c", reason: "هـ" },
    ],
    summaryText: "ملخص",
  });
  const data = await digest.digest(new Date(T0).toISOString(), "editor-1");
  assert.deepEqual(data.items.map((item) => item.itemId), ["new-b", "new-d", "new-a"]);

  const empty = setup({ items: [{ itemId: "made-up", reason: "x" }], summaryText: "" });
  await assert.rejects(empty.digest.digest(new Date(T0).toISOString(), "editor-1"), OpenAIUpstreamError);
});

test("digest with nothing new answers without a model call", async () => {
  const { digest, calls } = setup();
  const data = await digest.digest(new Date(T0 + 8 * HOUR).toISOString(), "editor-1");
  assert.deepEqual(data, { items: [], summaryText: "", sourceCount: 0 });
  assert.equal(calls.length, 0);
});

test("digest is cached 10 minutes per since hour and concurrent requests share one call", async () => {
  const { digest, calls, clock, gate, release } = setup();
  gate.hold = true;
  const first = digest.digest(new Date(T0 + 5 * MIN).toISOString(), "editor-1");
  const second = digest.digest(new Date(T0 + 55 * MIN).toISOString(), "editor-2");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1, "same hour in flight → one call");
  gate.hold = false;
  release();
  assert.deepEqual(await first, await second);

  clock.now += DIGEST_CACHE_TTL_MS - 1;
  await digest.digest(new Date(T0 + 30 * MIN).toISOString(), "editor-1");
  assert.equal(calls.length, 1, "still cached just before 10 minutes");

  await digest.digest(new Date(T0 + HOUR).toISOString(), "editor-1");
  assert.equal(calls.length, 2, "another hour is another entry");

  clock.now += 1;
  await digest.digest(new Date(T0).toISOString(), "editor-1");
  assert.equal(calls.length, 3, "expired after 10 minutes");
});

test("a failed digest is not cached", async () => {
  let fail = true;
  const { digest, calls } = setup(() => (fail ? { items: [], summaryText: "" } : { items: [{ itemId: "new-a", reason: "أ" }], summaryText: "ملخص" }));
  await assert.rejects(digest.digest(new Date(T0).toISOString(), "editor-1"), OpenAIUpstreamError);
  fail = false;
  const data = await digest.digest(new Date(T0).toISOString(), "editor-1");
  assert.equal(data.items.length, 1);
  assert.equal(calls.length, 2);
});

test("the digest cache is bounded and expires in insertion order", () => {
  const cache = new DigestCache<number>(1_000, 3);
  for (let key = 1; key <= 5; key += 1) cache.set(key, key, 0);
  assert.equal(cache.size, 3);
  assert.equal(cache.get(1, 0), undefined, "oldest dropped");
  assert.equal(cache.get(5, 0), 5);
  cache.set(3, 33, 500);
  assert.equal(cache.get(4, 999), 4);
  assert.equal(cache.get(4, 1_000), undefined, "expires at ttl");
  assert.equal(cache.get(3, 1_000), 33, "rewritten entry lives on");
  assert.equal(cache.size, 1);
  assert.ok(DIGEST_CACHE_MAX > 0 && DIGEST_CACHE_TTL_MS === 10 * 60 * 1000);
});

test("since floors to its hour and must be a past ISO time", () => {
  assert.equal(sinceHour(new Date(T0 + 59 * MIN + 59_000).toISOString()), T0);
  assert.ok(newsDigestBodySchema.safeParse({ since: new Date(Date.now() - HOUR).toISOString() }).success);
  assert.ok(newsDigestBodySchema.safeParse({ since: "2026-11-04T07:05:00+02:00" }).success);
  for (const body of [{}, { since: "" }, { since: "yesterday" }, { since: 1730700000000 }, { since: new Date(Date.now() + HOUR).toISOString() }]) {
    assert.equal(newsDigestBodySchema.safeParse(body).success, false, JSON.stringify(body));
  }
});
