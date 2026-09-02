import { env } from "../config/index.js";
import { ValidationError } from "../utils/errors.js";
import { DESK_ASSIGNMENT_FOOTER } from "../ai/prompts/editorial.js";
import { NEWS_SUMMARY_INSTRUCTIONS, storyFormatAssignment } from "../ai/prompts/news.js";
import { newsSummaryJsonSchema, newsSummaryOutputSchema } from "../ai/outputSchemas.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import type { NewsAggregator } from "./newsAggregator.js";
import { fetchPublicText, looksLikeHttpUrl } from "./urlFetcher.js";
import type { NewsSummarizeBody } from "../schemas/news.schema.js";

type NewsServiceDeps = {
  aggregator: NewsAggregator;
  openai: OpenAIClient;
  userId?: string;
};

export class NewsService {
  constructor(private readonly deps: Omit<NewsServiceDeps, "userId">) {}

  listSources() {
    return { sources: this.deps.aggregator.listSources() };
  }

  async getFeed(source?: string, query?: string) {
    return this.deps.aggregator.getFeed(source, query);
  }

  async summarize(body: NewsSummarizeBody, userId: string) {
    const language = body.language ?? "ar";
    const format = body.briefing ? "briefing" : (body.format ?? "desk");
    const { input, webSearch } = await this.buildPrompt(body, language);

    return this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "medium",
      verbosity: format === "briefing" || format === "context" ? "medium" : "low",
      instructions: NEWS_SUMMARY_INSTRUCTIONS,
      input,
      schemaName: "news_summary",
      schema: newsSummaryJsonSchema,
      parse: (value) => {
        const parsed = newsSummaryOutputSchema.parse(value);
        return {
          ...parsed,
          format,
          title: scrubDeskProse(parsed.title),
          dek: scrubDeskProse(parsed.dek),
          summary: scrubDeskProse(parsed.summary),
          bullets: parsed.bullets.map(scrubDeskProse),
        };
      },
      webSearch,
      userId,
    });
  }

  private async buildPrompt(body: NewsSummarizeBody, language: "ar" | "en") {
    const format = body.format ?? "desk";
    const spec = storyFormatAssignment(format, language);

    if (body.briefing) {
      const feed = await this.deps.aggregator.getFeed();
      const top = feed.items.slice(0, 8);
      if (top.length === 0) throw new ValidationError("invalid-request");
      const lines = top.map((item, index) => {
        const links = item.sources.map((source) => `${source.name}: ${source.url}`).join(" | ");
        return `${index + 1}. ${item.title}\n${item.excerpt}\n${links}`;
      });
      return {
        webSearch: false,
        input: `Desk assignment: file a ${language} briefing of the current top stories. 220–320 words. Numbered plain paragraphs, one story each. Keep each item distinct. Do not merge them into a theme essay.\n\n${lines.join("\n\n")}\n\n${DESK_ASSIGNMENT_FOOTER}`,
      };
    }

    if (body.itemId) {
      const item = await this.deps.aggregator.getItem(body.itemId);
      if (!item) throw new ValidationError("invalid-request");
      const links = item.sources.map((source) => `${source.name}: ${source.url}`).join("\n");
      return {
        webSearch: false,
        input: `Desk assignment: file this cluster for a slot editor.\n${spec}\nStay on this story. Use only the sources below.\n\nHeadline: ${item.title}\nExcerpt: ${item.excerpt}\nPublished: ${item.publishedAt}\nSources:\n${links}\n\n${DESK_ASSIGNMENT_FOOTER}`,
      };
    }

    const raw = body.input?.trim() ?? "";
    if (!raw) throw new ValidationError("invalid-request");

    if (looksLikeHttpUrl(raw)) {
      const page = await fetchPublicText(raw);
      if (page.text) {
        return {
          webSearch: false,
          input: `Desk assignment: file this article.\n${spec}\nStay on this page. Do not add facts from general knowledge.\n\nSource URL: ${page.url}\n\n${page.text}\n\n${DESK_ASSIGNMENT_FOOTER}`,
        };
      }
      return {
        webSearch: true,
        input: `Desk assignment: find this article and file it.\n${spec}\nCite the outlet. Do not invent a URL.\n\nURL: ${raw}\n\n${DESK_ASSIGNMENT_FOOTER}`,
      };
    }

    return {
      webSearch: true,
      input: `Desk assignment: latest reporting on this topic.\n${spec}\nCite the outlets you use. If coverage is thin, say so in one line.\n\nTopic: ${raw}\n\n${DESK_ASSIGNMENT_FOOTER}`,
    };
  }
}
