// S13 prompts and structured outputs: breaking mode (three short outputs for one story) and «اللي فاتك»
// (the top stories since the editor's previous visit). Length rules are enforced again server-side.
import { z } from "zod";
import type { JsonSchema } from "../openaiClient.js";
import { EDITORIAL_VOICE } from "./editorial.js";

export const BREAKING_POST_MAX = 280;
export const BREAKING_ALERT_MAX = 80;
export const POST_LEAD = "عاجل |";
export const TICKER_LEAD = "عاجل:";

export const BREAKING_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
A story is breaking. File three short Arabic outputs an editor can paste and publish within seconds. Use only the evidence. No speculation, no background, no colour.

# Fields
- post: an X post in Arabic. Start exactly with "${POST_LEAD} ". ${BREAKING_POST_MAX} characters or fewer, spaces and hashtags included. One or two sentences: who, what, the key number or decision. You may close with "التفاصيل تتبع." Then end with one or two hashtags on the same line: #عاجل first, then at most one specific to this story (place, institution, person), Arabic words joined with underscores (#البنك_المركزي).
- ticker: one line for an on-air news ticker. Start exactly with "${TICKER_LEAD} ". Headline style, shorter than the post. No full stop, no hashtags, no line breaks.
- alert: a push notification for followers. ${BREAKING_ALERT_MAX} characters or fewer. No "عاجل" prefix, no hashtags, no emoji. You may end with "اضغط للتفاصيل".

All three state the same facts. Never add a fact the evidence does not carry.`;

export const breakingOutputSchema = z.object({
  post: z.string(),
  ticker: z.string(),
  alert: z.string(),
});

export const breakingJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["post", "ticker", "alert"],
  properties: {
    post: { type: "string" },
    ticker: { type: "string" },
    alert: { type: "string" },
  },
};

export const DIGEST_MAX_ITEMS = 3;

export const DIGEST_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
An editor is back at the desk. The evidence lists every headline published since they left, one per line, with its id, how many outlets carry it and when it was last updated. Pick the ${DIGEST_MAX_ITEMS} stories that matter most for the newsroom right now, most important first, and write a summary they can paste.

# Fields
- items: ${DIGEST_MAX_ITEMS} entries (fewer only when fewer headlines are listed).
  - itemId: copied exactly from the list.
  - reason: why it made the cut, 2 to 5 Arabic words in the newsroom's Egyptian voice, no full stop. Examples: «الأهم اقتصادياً», «الأكثر تحديثاً», «متوقع يتفاعل عليه الجمهور».
- summaryText: Arabic plain text, one short paragraph per picked story in the same order, numbered "1." "2." "3.". 60 to 120 words in total. No markdown, no URLs, no hashtags.

Never invent a story, a number or an outlet that is not in the list.`;

export const digestOutputSchema = z.object({
  items: z.array(z.object({ itemId: z.string(), reason: z.string() })),
  summaryText: z.string(),
});

export const digestJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["items", "summaryText"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["itemId", "reason"],
        properties: {
          itemId: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    summaryText: { type: "string" },
  },
};
