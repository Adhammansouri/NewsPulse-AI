import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { newsSummarizeBodySchema } from "../schemas/news.schema.js";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import type { NewsAggregator } from "./newsAggregator.js";
import { NewsService } from "./newsService.js";

const feedItems = Array.from({ length: 10 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Story ${index + 1}`,
  excerpt: `Excerpt ${index + 1}`,
  publishedAt: new Date(0).toISOString(),
  breaking: false,
  topic: "other" as const,
  sources: [{ id: "wire", name: "Wire", url: `https://example.com/${index + 1}` }],
}));

async function briefingStories(itemIds?: string[]) {
  let input = "";
  const openai = { async completeJson(options: Parameters<OpenAIClient["completeJson"]>[0]) {
    input = options.input;
    return options.parse({ title: "Briefing", dek: "", summary: "Summary", bullets: [], sources: [], language: "en" });
  } } as unknown as OpenAIClient;
  const aggregator = { async getFeed() { return { fetchedAt: new Date(0).toISOString(), items: feedItems }; } } as unknown as NewsAggregator;
  const workspace = new EditorialWorkspaceStore(":memory:");
  try {
    await new NewsService({ aggregator, openai, workspace }).summarize({ briefing: true, language: "en", itemIds }, "editor-1");
  } finally { workspace.close(); }
  return [...input.matchAll(/^\d+\. (Story \d+)$/gm)].map((match) => match[1]);
}

test("briefing puts pinned items first in request order, de-duplicated, skipping unknown ids", async () => {
  assert.deepEqual(
    await briefingStories(["item-9", "item-3", "item-9", "missing-item", "item-7"]),
    ["Story 9", "Story 3", "Story 7", "Story 1", "Story 2", "Story 4", "Story 5", "Story 6"],
  );
});

test("briefing without pins keeps the feed's top eight in feed order", async () => {
  const topEight = feedItems.slice(0, 8).map((item) => item.title);
  assert.deepEqual(await briefingStories(), topEight);
  assert.deepEqual(await briefingStories([]), topEight);
});

test("briefing itemIds accept up to eight non-empty ids", () => {
  assert.ok(newsSummarizeBodySchema.safeParse({ briefing: true, itemIds: feedItems.slice(0, 8).map((item) => item.id) }).success);
  for (const itemIds of [feedItems.slice(0, 9).map((item) => item.id), [""], ["   "], ["x".repeat(65)], [42]]) {
    assert.equal(newsSummarizeBodySchema.safeParse({ briefing: true, itemIds }).success, false, JSON.stringify(itemIds));
  }
});
