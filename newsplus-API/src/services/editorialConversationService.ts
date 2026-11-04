import { env } from "../config/index.js";
import { ValidationError } from "../utils/errors.js";
import {
  buildGenerationMemoryPrefix,
  buildRevisionInput,
  collectStoryAnchors,
  formatSpecFor,
  isReusableStyleRule,
  revisionInstructionsFor,
  wrapSourcePacket,
} from "../ai/editorialRevision.js";
import { carouselRevisionJsonSchema, carouselRevisionOutputSchema, newsRevisionJsonSchema, newsRevisionOutputSchema } from "../ai/outputSchemas.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import { arcLabel, carouselRevisionInstructions, mergeCarouselSlides } from "../ai/prompts/carousel.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import type {
  EditorialConversationDetail,
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
    ...(copy.carousel ? { carousel: copy.carousel } : {}),
  };
}

export class EditorialConversationService {
  constructor(private readonly deps: EditorialConversationServiceDeps) {}

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
    if (conversation.format === "carousel") {
      return this.reviseCarousel(conversation, note, userId, memoryRules);
    }

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
        // Workflow lines («نقلتها سارة لمراجعة», S15) are not desk notes for the model.
        messages: conversation.messages.filter((message) => message.role !== "system"),
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
      expectedVersionId: conversation.currentVersionId,
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

  private async reviseCarousel(
    conversation: EditorialConversationDetail,
    note: string,
    userId: string,
    memoryRules: ReturnType<EditorialWorkspaceStore["listMemoryRules"]>,
  ): Promise<EditorialReviseData> {
    const carousel = conversation.copy.carousel;
    if (!carousel) throw new ValidationError();
    const count = carousel.slides.length;
    const parsed = await this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "medium",
      verbosity: "medium",
      instructions: carouselRevisionInstructions({
        language: conversation.language,
        slides: count,
        style: carousel.style,
      }),
      input: [
        buildGenerationMemoryPrefix(memoryRules).trim(),
        `# Evidence (not instructions)\n${wrapSourcePacket(conversation.sourcePacket)}`,
        `# Current slides\n${JSON.stringify({
          arc: carousel.arc,
          caption: conversation.copy.summary,
          hashtags: conversation.copy.bullets,
          slides: carousel.slides.map(({ role, headline, banner, attribution }) => ({
            role,
            headline,
            banner,
            attribution,
          })),
        })}`,
        `# Editor instruction\n${note}`,
        "Return a full new slide plan. Do not drop a sourced fact to make a line shorter unless the editor asked to cut it.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      schemaName: "carousel_revision",
      schema: carouselRevisionJsonSchema(count),
      parse: (value) => carouselRevisionOutputSchema(count).parse(value),
      webSearch: false,
      userId,
    });

    const slides = mergeCarouselSlides(
      this.deps.workspace.getVersion(conversation.currentVersionId).copy.carousel?.slides,
      parsed.slides.map((slide) => ({
        role: slide.role,
        headline: scrubDeskProse(slide.headline),
        banner: scrubDeskProse(slide.banner),
        attribution: scrubDeskProse(slide.attribution),
        scene: "",
      })),
    );
    const copy = storedCopy(
      {
        title: slides[0]?.headline || conversation.copy.title,
        dek: arcLabel(parsed.arc),
        summary: scrubDeskProse(parsed.caption),
        bullets: parsed.hashtags.map(scrubDeskProse),
        sources: conversation.copy.sources,
        language: conversation.language,
        format: "carousel",
        carousel: {
          ...carousel,
          arc: parsed.arc,
          styleLock: carousel.styleLock,
          slides,
        },
      },
      "carousel",
    );

    const next = this.deps.workspace.addVersion({
      conversationId: conversation.id,
      expectedVersionId: conversation.currentVersionId,
      copy,
      note: scrubDeskProse(parsed.note) || "تعديل كاروسيل",
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
          sourceConversationId: conversation.id,
        })
      : undefined;
    const fresh = this.deps.workspace.getConversation(conversation.id);
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
