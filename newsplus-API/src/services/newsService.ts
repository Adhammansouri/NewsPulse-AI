import { env } from "../config/index.js";
import { ValidationError } from "../utils/errors.js";
import { NEWS_SUMMARY_INSTRUCTIONS } from "../ai/prompts/news.js";
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
    const { input, webSearch } = await this.buildPrompt(body, language);

    return this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "low",
      verbosity: "medium",
      instructions: NEWS_SUMMARY_INSTRUCTIONS,
      input,
      schemaName: "news_summary",
      schema: newsSummaryJsonSchema,
      parse: (value) => {
        const parsed = newsSummaryOutputSchema.parse(value);
        return {
          ...parsed,
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
        input: `Write a desk briefing in ${language} covering these current stories. 220–320 words. Numbered plain paragraphs, no markdown. Keep each item distinct.\n\n${lines.join("\n\n")}`,
      };
    }

    if (body.itemId) {
      const item = await this.deps.aggregator.getItem(body.itemId);
      if (!item) throw new ValidationError("invalid-request");
      const links = item.sources.map((source) => `${source.name}: ${source.url}`).join("\n");
      return {
        webSearch: false,
        input: `Summarise this news cluster in ${language}. Use only these sources.\n\nHeadline: ${item.title}\nExcerpt: ${item.excerpt}\nPublished: ${item.publishedAt}\nSources:\n${links}`,
      };
    }

    const raw = body.input?.trim() ?? "";
    if (!raw) throw new ValidationError("invalid-request");

    if (looksLikeHttpUrl(raw)) {
      const page = await fetchPublicText(raw);
      if (page.text) {
        return {
          webSearch: false,
          input: `Summarise this article in ${language}. Source URL: ${page.url}\n\n${page.text}`,
        };
      }
      return {
        webSearch: true,
        input: `Find and summarise this article in ${language}. URL: ${raw}`,
      };
    }

    return {
      webSearch: true,
      input: `Latest reporting on this topic, summarised in ${language}: ${raw}`,
    };
  }
}
