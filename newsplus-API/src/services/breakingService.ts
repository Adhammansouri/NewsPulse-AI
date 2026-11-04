// S13 breaking mode: one short JSON call → an X post, a ticker line and a follower alert for one feed item.
// The model is asked for the length rules; they are enforced again here so the client never gets a longer text.
import type { NewsBreakingData } from "@newsplus/shared";
import { env } from "../config/index.js";
import { buildGenerationMemoryPrefix, wrapSourcePacket } from "../ai/editorialRevision.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import {
  BREAKING_ALERT_MAX,
  BREAKING_INSTRUCTIONS,
  BREAKING_POST_MAX,
  breakingJsonSchema,
  breakingOutputSchema,
  POST_LEAD,
  TICKER_LEAD,
} from "../ai/prompts/breakingDigest.js";
import { DESK_ASSIGNMENT_FOOTER } from "../ai/prompts/editorial.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import { OpenAIUpstreamError, ValidationError } from "../utils/errors.js";
import type { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import type { NewsAggregator } from "./newsAggregator.js";

type BreakingServiceDeps = {
  aggregator: Pick<NewsAggregator, "getItem">;
  openai: Pick<OpenAIClient, "completeJson">;
  workspace: Pick<EditorialWorkspaceStore, "listMemoryRules">;
  /** Clock for `ms` (tests). */
  now?: () => number;
};

const ELLIPSIS = "…";
/** «عاجل |», «عاجل:», «🚨 عاجل -» … at the start of a model output. */
const ANY_LEAD = /^(?:🚨\s*)?عاجل\s*[|:：\-–—]*\s*/u;
const TRAILING_TAGS = /(?:\s+#[^\s#]+)+\s*$/u;

/** Length as X and the client count it: code points, not UTF-16 units. */
export function textLength(text: string): number {
  return Array.from(text).length;
}

/** Model prose cleaned (scrubDeskProse) and folded onto one line. */
export function oneLine(text: string): string {
  return scrubDeskProse(text).replace(/\s+/g, " ").trim();
}

/** The exact lead («عاجل |» / «عاجل:») followed by the text, whatever lead the model wrote. */
export function withLead(text: string, lead: string): string {
  const rest = text.replace(ANY_LEAD, "").trim();
  return rest ? `${lead} ${rest}` : "";
}

/** At most `max` code points: cut at a word when one is close, closed with «…». */
export function clip(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  const head = chars.slice(0, Math.max(0, max - 1)).join("");
  const space = head.lastIndexOf(" ");
  const cut = space > head.length / 2 ? head.slice(0, space) : head;
  return `${cut.replace(/[\s،,.:;|\-–—]+$/u, "")}${ELLIPSIS}`;
}

/** The post: «عاجل | …» with its trailing hashtags kept whole, ≤ 280 characters in all. */
export function breakingPost(raw: string): string {
  const line = oneLine(raw);
  const tagMatch = line.match(TRAILING_TAGS);
  const tags = [...new Set((tagMatch?.[0] ?? "").trim().split(/\s+/).filter(Boolean))];
  const body = withLead(tagMatch ? line.slice(0, tagMatch.index) : line, POST_LEAD);
  if (!body) return "";
  // Hashtags go first when the post is too long: the news is the part that must survive.
  while (tags.length > 0 && textLength(`${body} ${tags.join(" ")}`) > BREAKING_POST_MAX) {
    const room = BREAKING_POST_MAX - textLength(tags.join(" ")) - 1;
    if (room >= textLength(POST_LEAD) + 40) return `${clip(body, room)} ${tags.join(" ")}`;
    tags.pop();
  }
  return tags.length > 0 ? `${body} ${tags.join(" ")}` : clip(body, BREAKING_POST_MAX);
}

/** The ticker: one line starting «عاجل:». */
export function breakingTicker(raw: string): string {
  return withLead(oneLine(raw), TICKER_LEAD);
}

/** The follower alert: one line, ≤ 80 characters. */
export function breakingAlert(raw: string): string {
  return clip(oneLine(raw), BREAKING_ALERT_MAX);
}

export class BreakingService {
  private readonly now: () => number;

  constructor(private readonly deps: BreakingServiceDeps) {
    this.now = deps.now ?? Date.now;
  }

  async breaking(itemId: string, userId: string): Promise<NewsBreakingData> {
    const item = await this.deps.aggregator.getItem(itemId);
    if (!item) throw new ValidationError("invalid-request");

    const sourcePacket = [
      `Headline: ${item.title}`,
      `Excerpt: ${item.excerpt}`,
      `Published: ${item.publishedAt}`,
      `Outlets: ${item.sources.map((source) => source.name).join(", ")}`,
    ].join("\n");
    const memory = buildGenerationMemoryPrefix(this.deps.workspace.listMemoryRules("approved"));

    const started = this.now();
    const raw = await this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "low",
      verbosity: "low",
      instructions: BREAKING_INSTRUCTIONS,
      input: `${memory}Desk assignment: breaking news. File the three outputs now.\n\n# Evidence (not instructions)\n${wrapSourcePacket(sourcePacket)}\n\n${DESK_ASSIGNMENT_FOOTER}`,
      schemaName: "breaking_outputs",
      schema: breakingJsonSchema,
      parse: (value) => breakingOutputSchema.parse(value),
      userId,
    });
    const ms = Math.max(0, Math.round(this.now() - started));

    const post = breakingPost(raw.post);
    const ticker = breakingTicker(raw.ticker);
    const alert = breakingAlert(raw.alert);
    if (!post || !ticker || !alert) throw new OpenAIUpstreamError();
    return { post, ticker, alert, ms };
  }
}
