import { env } from "../config/index.js";
import { DESK_ASSIGNMENT_FOOTER } from "../ai/prompts/editorial.js";
import { GENERATE_INSTRUCTIONS } from "../ai/prompts/generate.js";
import { generateJsonSchema, generateOutputSchema } from "../ai/outputSchemas.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { fetchPublicText, looksLikeHttpUrl } from "./urlFetcher.js";
import type { GenerateBody } from "../schemas/generate.schema.js";

const STYLE_NAME = {
  brief: "news brief",
  article: "news article",
  report: "desk report",
} as const;

const WORD_BAND = {
  brief: { short: { min: 80, max: 110 }, standard: { min: 120, max: 170 }, long: { min: 180, max: 230 } },
  article: { short: { min: 300, max: 450 }, standard: { min: 450, max: 700 }, long: { min: 750, max: 950 } },
  report: { short: { min: 450, max: 650 }, standard: { min: 650, max: 900 }, long: { min: 950, max: 1200 } },
} as const;

const TONE_LINE = {
  desk: "Register: night desk. Tight, attributed, no flourish.",
  formal: "Register: institutional and diplomatic. Still news, not a press release.",
  explainer: "Register: explainer. One why-this-matters-now graf after the lead. No TED cadence.",
} as const;

function extractSource(prompt: string) {
  const trimmed = prompt.trim();
  const match = trimmed.match(/^(https?:\/\/\S+)/i);
  if (!match) return { url: "", assignment: trimmed };
  const url = match[1];
  if (!looksLikeHttpUrl(url)) return { url: "", assignment: trimmed };
  return { url, assignment: trimmed.slice(url.length).trim() };
}

export class GenerateService {
  constructor(private readonly openai: OpenAIClient) {}

  async generate(body: GenerateBody, userId: string) {
    const prompt = body.prompt.trim();
    const length = body.length ?? "standard";
    const tone = body.tone ?? "desk";
    const { url, assignment } = extractSource(prompt);
    const band = WORD_BAND[body.style][length];
    let pageUrl = url;
    let pageText = "";

    if (url) {
      const page = await fetchPublicText(url);
      pageUrl = page.url || url;
      pageText = page.text;
    }

    const hasPage = pageText.length > 0;
    const sourceMode = hasPage ? "page" : url ? "search" : "notes";
    const needsSearch = !hasPage || body.style !== "brief";

    const styleLine = `a ${STYLE_NAME[body.style]}. HARD LENGTH: the body field must be ${band.min}–${band.max} words (body only; title and dek do not count).`;
    const angle = body.angle?.trim()
      ? `\nEditorial angle (honour it only if the sources support it): ${body.angle.trim()}`
      : "";
    const notes = assignment
      ? `\n\nAssignment notes:\n${assignment}`
      : url
        ? "\n\nAssignment: file from the source URL."
        : "";

    let sourceBlock = "";
    if (hasPage) {
      sourceBlock = `\n\nSource URL: ${pageUrl}\nThe page text below is the spine of the file.${
        body.style === "brief" ? "" : " Use web_search only to add attributed context on THIS story."
      }\nSource text:\n${pageText}`;
    } else if (url) {
      sourceBlock = `\n\nSource URL: ${pageUrl}\nThe page could not be retrieved from our servers (paywall, bot wall, or timeout). You MUST use web_search: open this exact URL and corroborating coverage of the same incident. Then file the requested length. Do not say the source is missing.`;
    }

    const input = `Desk assignment: file ${styleLine} in ${body.language}.\n${TONE_LINE[tone]}${angle}${notes}${sourceBlock}\n\n${DESK_ASSIGNMENT_FOOTER}`;

    const copy = await this.openai.completeJson({
      model: env.openaiModelGenerate,
      effort: "medium",
      verbosity: body.style === "brief" || length === "short" ? "low" : "high",
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
      webSearch: needsSearch,
      userId,
    });

    return { ...copy, sourceMode };
  }
}
