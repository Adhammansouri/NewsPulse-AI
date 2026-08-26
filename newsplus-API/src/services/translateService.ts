import { env } from "../config/index.js";
import { ValidationError } from "../utils/errors.js";
import { TRANSLATE_INSTRUCTIONS } from "../ai/prompts/translate.js";
import { translateJsonSchema, translateOutputSchema } from "../ai/outputSchemas.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { fetchPublicText, looksLikeHttpUrl } from "./urlFetcher.js";
import type { TranslateBody } from "../schemas/translate.schema.js";

export class TranslateService {
  constructor(private readonly openai: OpenAIClient) {}

  async translate(body: TranslateBody, userId: string) {
    const source = await this.resolveSource(body);
    const input = `Target language: ${body.target}\n\nTranslate the following:\n${source}`;

    return this.openai.completeJson({
      model: env.openaiModelTranslate,
      effort: "none",
      verbosity: "medium",
      instructions: TRANSLATE_INSTRUCTIONS,
      input,
      schemaName: "translation",
      schema: translateJsonSchema,
      parse: (value) => translateOutputSchema.parse(value),
      webSearch: false,
      userId,
    });
  }

  private async resolveSource(body: TranslateBody) {
    if (body.text?.trim()) return body.text.trim();
    const raw = body.url?.trim() ?? "";
    if (!looksLikeHttpUrl(raw)) throw new ValidationError("url-blocked");
    const page = await fetchPublicText(raw);
    if (!page.text) throw new ValidationError("invalid-request");
    return `Source URL: ${page.url}\n\n${page.text}`;
  }
}
