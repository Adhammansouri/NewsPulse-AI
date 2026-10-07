import { env } from "../config/index.js";
import { OpenAIUpstreamError, ValidationError } from "../utils/errors.js";
import { TRANSLATE_INSTRUCTIONS } from "../ai/prompts/translate.js";
import { translateJsonSchema, translateOutputSchema } from "../ai/outputSchemas.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { fetchPublicText, looksLikeHttpUrl } from "./urlFetcher.js";
import type { TranslateBody } from "../schemas/translate.schema.js";

export class TranslateService {
  constructor(private readonly openai: Pick<OpenAIClient, "completeJson">) {}

  async translate(body: TranslateBody, userId: string) {
    const source = await this.resolveSource(body);
    const input = JSON.stringify({ targetLanguage: body.target, sourceText: source.text, sourceUrl: source.url });

    return this.openai.completeJson({
      model: env.openaiModelTranslate,
      effort: "medium",
      verbosity: "medium",
      instructions: TRANSLATE_INSTRUCTIONS,
      input,
      schemaName: "translation",
      schema: translateJsonSchema,
      parse: (value) => {
        const parsed = translateOutputSchema.parse(value);
        if (parsed.targetLanguage !== body.target || !parsed.translated.trim()) {
          throw new OpenAIUpstreamError();
        }
        return {
          ...parsed,
          // The original is evidence for the editor, not model-authored copy.
          original: source.text,
          translated: parsed.translated.trim(),
        };
      },
      webSearch: false,
      userId,
    });
  }

  private async resolveSource(body: TranslateBody) {
    if (body.text?.trim()) return { text: body.text.trim(), url: undefined };
    const raw = body.url?.trim() ?? "";
    if (!looksLikeHttpUrl(raw)) throw new ValidationError("url-blocked");
    const page = await fetchPublicText(raw, { rejectTruncated: true });
    if (!page.text) throw new ValidationError("invalid-request");
    return { text: page.text, url: page.url };
  }
}
