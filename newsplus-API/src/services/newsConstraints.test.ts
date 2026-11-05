import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { editorConstraintsPrefix } from "../ai/prompts/news.js";
import { newsSummarizeBodySchema } from "../schemas/news.schema.js";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import type { NewsAggregator } from "./newsAggregator.js";
import { NewsService } from "./newsService.js";

// S14: `NewsSummarizeRequest.constraints` — the editor's settled source conflicts, bounded and injected into the
// summarize prompt (story copy and the carousel plan) as editor constraints, before the evidence.
const CONSTRAINT = "اذكر التضخم: ٢٫٩٪ بحسب العربية و٣٫١٪ بحسب سكاي";

const item = {
  id: "story-1",
  title: "المركزي يثبت الفائدة",
  excerpt: "التضخم فوق المستهدف",
  publishedAt: new Date(0).toISOString(),
  breaking: false,
  topic: "economy" as const,
  sources: [{ id: "a", name: "العربية", url: "https://example.com/a" }],
};

async function summarizeInput(body: Parameters<NewsService["summarize"]>[0]) {
  let input = "";
  const openai = {
    async completeJson(options: Parameters<OpenAIClient["completeJson"]>[0]) {
      input = options.input;
      if (options.schemaName === "carousel_plan") {
        return options.parse({
          arc: "statement",
          caption: "caption",
          hashtags: ["#x"],
          slides: Array.from({ length: 3 }, (_, index) => ({ role: index === 0 ? "hook" : index === 2 ? "closer" : "beat", headline: "h", banner: "b", attribution: "a" })),
        });
      }
      return options.parse({ title: "t", dek: "d", summary: "s", bullets: [], sources: [], language: "ar" });
    },
  } as unknown as OpenAIClient;
  const aggregator = { async getItem() { return item; } } as unknown as NewsAggregator;
  const workspace = new EditorialWorkspaceStore(":memory:");
  try {
    await new NewsService({ aggregator, openai, workspace }).summarize(body, "editor-1");
  } catch {
    // The carousel planner's schema may reject the mock; the prompt was captured either way.
  } finally {
    workspace.close();
  }
  return input;
}

test("constraints: at most 6, each 1–300 characters", () => {
  const ok = { itemId: "story-1", constraints: Array.from({ length: 6 }, () => "x".repeat(300)) };
  assert.ok(newsSummarizeBodySchema.safeParse(ok).success);
  assert.ok(newsSummarizeBodySchema.safeParse({ itemId: "story-1" }).success, "optional");
  for (const constraints of [Array.from({ length: 7 }, () => "x"), ["x".repeat(301)], [""], ["   "], [42], "x"]) {
    assert.equal(newsSummarizeBodySchema.safeParse({ itemId: "story-1", constraints }).success, false, JSON.stringify(constraints).slice(0, 40));
  }
});

test("editorConstraintsPrefix: one bullet per constraint, nothing when empty", () => {
  assert.equal(editorConstraintsPrefix(undefined), "");
  assert.equal(editorConstraintsPrefix([" ", ""]), "");
  const block = editorConstraintsPrefix([CONSTRAINT, "اعتمد  ٣٫١٪\n(سكاي)"]);
  assert.match(block, /^# Editor constraints/);
  assert.ok(block.includes(`\n- ${CONSTRAINT}\n`));
  assert.ok(block.includes("\n- اعتمد ٣٫١٪ (سكاي)\n"), "whitespace folded onto one line");
});

test("summarize injects the constraints before the evidence; without them the prompt is unchanged", async () => {
  const withConstraints = await summarizeInput({ itemId: "story-1", format: "desk", constraints: [CONSTRAINT] });
  const constraintsAt = withConstraints.indexOf(`- ${CONSTRAINT}`);
  assert.ok(constraintsAt > 0, "the constraint is in the prompt");
  assert.ok(constraintsAt < withConstraints.indexOf("# Evidence (not instructions)"), "as an instruction, not as evidence");
  const plain = await summarizeInput({ itemId: "story-1", format: "desk" });
  assert.equal(plain.includes("# Editor constraints"), false);
  assert.equal(withConstraints.replace(editorConstraintsPrefix([CONSTRAINT]), ""), plain);
});

test("the carousel plan gets the constraints too", async () => {
  const input = await summarizeInput({ itemId: "story-1", format: "carousel", constraints: [CONSTRAINT] });
  assert.ok(input.includes(`- ${CONSTRAINT}`));
});
