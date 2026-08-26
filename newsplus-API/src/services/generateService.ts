import { env } from "../config/index.js";
import { GENERATE_INSTRUCTIONS } from "../ai/prompts/generate.js";
import { generateJsonSchema, generateOutputSchema } from "../ai/outputSchemas.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { fetchPublicText, looksLikeHttpUrl } from "./urlFetcher.js";
import type { GenerateBody } from "../schemas/generate.schema.js";

export class GenerateService {
  constructor(private readonly openai: OpenAIClient) {}

  async generate(body: GenerateBody, userId: string) {
    const prompt = body.prompt.trim();
    let reference = "";

    if (looksLikeHttpUrl(prompt)) {
      const page = await fetchPublicText(prompt);
      if (page.text) reference = `\n\nSource URL: ${page.url}\nSource text:\n${page.text}`;
    }

    const angle = body.angle?.trim() ? `\nEditorial angle: ${body.angle.trim()}` : "";
    const input = `Write a ${body.style} in ${body.language}.${angle}\n\nAssignment:\n${prompt}${reference}`;

    return this.openai.completeJson({
      model: env.openaiModelGenerate,
      effort: "medium",
      verbosity: body.style === "brief" ? "low" : "high",
      instructions: GENERATE_INSTRUCTIONS,
      input,
      schemaName: "generated_copy",
      schema: generateJsonSchema,
      parse: (value) => {
        const parsed = generateOutputSchema.parse(value);
        return {
          ...parsed,
          title: scrubDeskProse(parsed.title),
          dek: scrubDeskProse(parsed.dek),
          body: scrubDeskProse(parsed.body),
        };
      },
      webSearch: !reference,
      userId,
    });
  }
}
