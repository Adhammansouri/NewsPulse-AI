import { env } from "../config/index.js";
import {
  buildGenerationMemoryPrefix,
  buildRevisionInput,
  collectStoryAnchors,
  formatSpecFor,
  isReusableStyleRule,
  revisionInstructionsFor,
} from "../ai/editorialRevision.js";
import { newsRevisionJsonSchema, newsRevisionOutputSchema } from "../ai/outputSchemas.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import type {
  EditorialConversationDetail,
  EditorialConversationListData,
  EditorialMemoryListData,
  EditorialMemoryStatus,
  EditorialReviseData,
} from "@newsplus/shared";
import type { EditorialWorkspaceStore, StoredEditorialCopy } from "./editorialWorkspaceStore.js";

type EditorialConversationServiceDeps = {
  openai: OpenAIClient;
  workspace: EditorialWorkspaceStore;
};

function storedCopy(copy: StoredEditorialCopy, format: StoredEditorialCopy["format"]): StoredEditorialCopy {
  return {
    title: scrubDeskProse(copy.title),
    dek: scrubDeskProse(copy.dek),
    summary: scrubDeskProse(copy.summary),
    bullets: copy.bullets.map(scrubDeskProse),
    sources: copy.sources,
    language: copy.language,
    format,
  };
}

export class EditorialConversationService {
  constructor(private readonly deps: EditorialConversationServiceDeps) {}

  listConversations(query?: string): EditorialConversationListData {
    return { items: this.deps.workspace.listConversations(query) };
  }

  getConversation(id: string): EditorialConversationDetail {
    return this.deps.workspace.getConversation(id);
  }

  listMemory(status?: EditorialMemoryStatus): EditorialMemoryListData {
    return { rules: this.deps.workspace.listMemoryRules(status) };
  }

  updateMemory(id: string, patch: { status?: EditorialMemoryStatus; instruction?: string }) {
    return this.deps.workspace.updateMemoryRule(id, patch);
  }

  restore(conversationId: string, versionId: string, userId: string): EditorialReviseData {
    const conversation = this.deps.workspace.restoreVersion(conversationId, versionId, userId);
    return {
      copy: conversation.copy,
      conversation,
      note: conversation.messages.at(-1)?.content ?? "استعادة نسخة",
    };
  }

  async revise(conversationId: string, instruction: string, userId: string): Promise<EditorialReviseData> {
    const conversation = this.deps.workspace.getConversation(conversationId);
    const note = instruction.trim();
    if (!note) {
      return { copy: conversation.copy, conversation, note: "" };
    }

    const memoryRules = this.deps.workspace.listMemoryRules("approved");
    const parsed = await this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "medium",
      verbosity: conversation.format === "video" || conversation.format === "context" ? "medium" : "low",
      instructions: revisionInstructionsFor(conversation.format, conversation.language),
      input: buildRevisionInput({
        formatSpec: formatSpecFor(conversation.format, conversation.language),
        memoryBlock: buildGenerationMemoryPrefix(memoryRules).trim(),
        sourcePacket: conversation.sourcePacket,
        currentCopy: conversation.copy,
        messages: conversation.messages,
        instruction: note,
      }),
      schemaName: "news_revision",
      schema: newsRevisionJsonSchema,
      parse: (value) => newsRevisionOutputSchema.parse(value),
      webSearch: false,
      userId,
    });

    const copy = storedCopy(
      {
        title: parsed.title,
        dek: parsed.dek,
        summary: parsed.summary,
        bullets: parsed.bullets,
        sources: parsed.sources,
        language: parsed.language,
        format: conversation.format,
      },
      conversation.format,
    );

    const next = this.deps.workspace.addVersion({
      conversationId,
      copy,
      note: scrubDeskProse(parsed.note) || "تعديل تحريري",
      createdBy: userId,
      userMessage: note,
    });

    const anchors = collectStoryAnchors(copy);
    const candidateInstruction = parsed.memoryInstruction.trim();
    const shouldStore =
      parsed.memoryPropose &&
      isReusableStyleRule(candidateInstruction, anchors) &&
      !memoryRules.some((rule) => rule.instruction === candidateInstruction);

    const memoryCandidate = shouldStore
      ? this.deps.workspace.createMemoryRule({
          instruction: candidateInstruction,
          rationale: parsed.memoryRationale.trim() || "قاعدة أسلوب اقترحها المكتب.",
          createdBy: userId,
          sourceConversationId: conversationId,
        })
      : undefined;

    const fresh = this.deps.workspace.getConversation(conversationId);
    return {
      copy: next.copy,
      conversation: fresh,
      note: next.messages.at(-1)?.content ?? parsed.note,
      memoryCandidate: memoryCandidate
        ? { instruction: memoryCandidate.instruction, rationale: memoryCandidate.rationale }
        : undefined,
    };
  }
}
