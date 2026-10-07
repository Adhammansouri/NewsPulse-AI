import assert from "node:assert/strict";
import { test } from "node:test";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { AppError } from "../utils/errors.js";
import { EditorialConversationService } from "./editorialConversationService.js";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";

test("a delayed revision cannot overwrite a newer edit or restored version", async () => {
  const workspace = new EditorialWorkspaceStore(":memory:");
  const copy = { title: "Source headline", dek: "", summary: "Source copy", bullets: [], sources: [], language: "en" as const, format: "desk" as const };
  const initial = workspace.createConversation({ title: copy.title, format: "desk", language: "en", sourcePacket: "Source evidence", copy, createdBy: "editor-1" });
  let finish: (value: unknown) => void = () => assert.fail("AI request was not started");
  const ai = { async completeJson(options: Parameters<OpenAIClient["completeJson"]>[0]) {
    return options.parse(await new Promise((resolve) => { finish = resolve; }));
  } } as unknown as OpenAIClient;
  const service = new EditorialConversationService({ openai: ai, workspace });
  try {
    const delayed = service.revise(initial.id, "Shorten the copy", "editor-1");
    const newer = workspace.addVersion({ conversationId: initial.id, copy: { ...copy, title: "Newer approved headline" }, note: "Manual edit", createdBy: "editor-2" });
    finish({ ...copy, title: "Stale AI headline", note: "Shortened", memoryPropose: false, memoryInstruction: "", memoryRationale: "" });
    await assert.rejects(delayed, (error: unknown) => error instanceof AppError && error.statusCode === 409);
    assert.equal(workspace.getConversation(initial.id).currentVersionId, newer.currentVersionId);
    assert.equal(workspace.getConversation(initial.id).copy.title, "Newer approved headline");
    assert.equal(workspace.getConversation(initial.id).versionCount, 2);
  } finally { workspace.close(); }
});
