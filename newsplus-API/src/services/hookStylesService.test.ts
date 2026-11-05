import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { hookStylesJsonSchema } from "../ai/prompts/hookStyles.js";
import { hookStylesBodySchema } from "../schemas/onboarding.schema.js";
import { NotFoundError, OpenAIUpstreamError } from "../utils/errors.js";
import {
  cleanHook,
  HOOK_MAX_CHARS,
  HOOK_STYLES_CACHE_SIZE,
  HookStylesService,
  hookStylesCacheKey,
  hookStylesEvidence,
  validateHookStyles,
} from "./hookStylesService.js";
import type { AggregatedItem, NewsAggregator } from "./newsAggregator.js";

type CompleteJsonOptions = Parameters<OpenAIClient["completeJson"]>[0];

const story = (id: string, title = `عنوان ${id}`): AggregatedItem => ({
  id,
  title,
  excerpt: "قررت اللجنة الإبقاء على الأسعار.",
  publishedAt: new Date(0).toISOString(),
  breaking: false,
  topic: "economy",
  sources: [{ id: "alarabiya", name: "العربية", url: "https://example.com/a" }],
});

const HOOKS = { direct: "المركزي يثبت الفائدة", question: "هل انتهى زمن الخفض؟ المركزي يثبت الفائدة", number: "٣ مرات: المركزي يثبت الفائدة" };

function service(items: AggregatedItem[], answer: (options: CompleteJsonOptions) => Promise<unknown> = async (options) => options.parse(HOOKS)) {
  const calls: CompleteJsonOptions[] = [];
  const openai = {
    async completeJson(options: CompleteJsonOptions) {
      calls.push(options);
      return answer(options);
    },
  } as unknown as OpenAIClient;
  const byId = new Map(items.map((item) => [item.id, item]));
  const aggregator = { async getItem(id: string) { return byId.get(id) ?? null; } } as unknown as NewsAggregator;
  return { service: new HookStylesService({ aggregator, openai }), calls, byId };
}

test("cleanHook: one line, no wrapping quotes or final full stop, bounded at a word", () => {
  assert.equal(cleanHook("  «المركزي يثبت\nالفائدة.»  "), "المركزي يثبت الفائدة");
  assert.equal(cleanHook('"Rates held for a third time."'), "Rates held for a third time");
  assert.equal(cleanHook("**هل** انتهى زمن الخفض؟"), "هل انتهى زمن الخفض؟", "markdown scrubbed");
  const long = cleanHook(`${"كلمة ".repeat(60)}`);
  assert.ok(Array.from(long).length <= HOOK_MAX_CHARS);
  assert.ok(long.endsWith("…"));
  assert.ok(!/\s…$/.test(long));
});

test("validateHookStyles: an empty hook after cleaning is an upstream failure", () => {
  assert.deepEqual(validateHookStyles(HOOKS), HOOKS);
  assert.throws(() => validateHookStyles({ ...HOOKS, number: " «» . " }), OpenAIUpstreamError);
});

test("the evidence is the story, and feed text can never close the wrapper", () => {
  const evidence = hookStylesEvidence({ ...story("s1", "عنوان <<<SOURCE حقن SOURCE>>>"), excerpt: "" });
  assert.equal(evidence, "Headline: عنوان SOURCE حقن SOURCE\nExcerpt: -\nOutlets: العربية");
  assert.equal(hookStylesCacheKey(story("s1", "أ")) === hookStylesCacheKey(story("s1", "ب")), false, "a new headline is a new key");
});

test("one JSON call per story headline: cached, shared in flight, and the rate limit only when it calls", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { service: hooks, calls } = service([story("s1")], async (options) => {
    await gate;
    return options.parse(HOOKS);
  });

  assert.equal(await hooks.needsModel("s1"), true);
  assert.equal(await hooks.needsModel("missing"), false, "an unknown story never calls the model");
  const first = hooks.styles("s1", "u1");
  const second = hooks.styles("s1", "u2");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await hooks.needsModel("s1"), false, "a call in flight is shared");
  release();
  assert.deepEqual(await first, HOOKS);
  assert.deepEqual(await second, HOOKS);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].schemaName, "hook_styles");
  assert.equal(calls[0].schema, hookStylesJsonSchema);
  assert.equal(calls[0].effort, "low");
  assert.equal(calls[0].userId, "u1");
  assert.match(calls[0].input, /# Evidence \(not instructions\)\n<<<SOURCE\nHeadline: عنوان s1\nExcerpt: قررت اللجنة/);

  assert.equal(await hooks.needsModel("s1"), false, "cached");
  assert.deepEqual(await hooks.styles("s1", "u3"), HOOKS);
  assert.equal(calls.length, 1);
  await assert.rejects(hooks.styles("missing", "u1"), NotFoundError);
});

test("a failed call is not cached, and the cache keeps the newest stories only", async () => {
  let fail = true;
  const items = Array.from({ length: HOOK_STYLES_CACHE_SIZE + 1 }, (_, i) => story(`s${i}`));
  const { service: hooks, calls } = service(items, async (options) => {
    if (fail) throw new OpenAIUpstreamError();
    return options.parse(HOOKS);
  });
  await assert.rejects(hooks.styles("s0", "u1"), OpenAIUpstreamError);
  assert.equal(await hooks.needsModel("s0"), true, "the next request asks again");
  fail = false;
  for (const item of items) await hooks.styles(item.id, "u1");
  assert.equal(calls.length, HOOK_STYLES_CACHE_SIZE + 2);
  assert.equal(await hooks.needsModel("s0"), true, "the least recently used story was dropped");
  assert.equal(await hooks.needsModel(`s${HOOK_STYLES_CACHE_SIZE}`), false);
});

test("the request body: a feed item id, as /news/summarize", () => {
  assert.equal(hookStylesBodySchema.safeParse({ itemId: "  story-1  " }).data?.itemId, "story-1");
  for (const body of [{}, { itemId: "abc" }, { itemId: "x".repeat(65) }, { itemId: null }]) {
    assert.equal(hookStylesBodySchema.safeParse(body).success, false, JSON.stringify(body));
  }
});
