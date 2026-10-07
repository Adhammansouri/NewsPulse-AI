import { createHash } from "node:crypto";
import OpenAI from "openai";
import { env } from "../config/index.js";
import {
  OpenAINotConfiguredError,
  OpenAIQuotaError,
  OpenAIUpstreamError,
  TooManyRequestsError,
} from "../utils/errors.js";

export type ReasoningEffort = "none" | "low" | "medium" | "high";
export type TextVerbosity = "low" | "medium" | "high";

export type JsonSchema = {
  type: "object";
  additionalProperties: false;
  required: string[];
  properties: Record<string, unknown>;
};

type CompleteJsonOptions<T> = {
  model: string;
  effort: ReasoningEffort;
  verbosity?: TextVerbosity;
  instructions: string;
  input: string;
  schemaName: string;
  schema: JsonSchema;
  parse: (value: unknown) => T;
  webSearch?: boolean;
  userId?: string;
};

function isOpenAIQuota(error: { code?: unknown; type?: unknown; message?: unknown }) {
  const code = `${error.code ?? ""} ${error.type ?? ""}`.toLowerCase();
  const message = String(error.message ?? "").toLowerCase();
  return (
    code.includes("quota") ||
    code.includes("billing") ||
    code.includes("credit") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("credit")
  );
}

function throwOpenAIError(error: unknown): never {
  if (
    error instanceof OpenAINotConfiguredError ||
    error instanceof OpenAIUpstreamError ||
    error instanceof OpenAIQuotaError ||
    error instanceof TooManyRequestsError
  ) {
    throw error;
  }
  if (env.nodeEnv !== "production") console.error("[openai]", error);
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) throw isOpenAIQuota(error) ? new OpenAIQuotaError() : new TooManyRequestsError();
    throw new OpenAIUpstreamError();
  }
  throw new OpenAIUpstreamError();
}

function safetyIdentifier(userId?: string) {
  if (!userId) return undefined;
  return createHash("sha256").update(`newsplus:${userId}`).digest("hex");
}

function extractOutputText(response: {
  output_text?: string | null;
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
}): string {
  if (response.output_text?.trim()) return response.output_text;
  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message" || !item.content) continue;
    for (const part of item.content) {
      if (part.type === "output_text" && part.text) chunks.push(part.text);
    }
  }
  return chunks.join("\n").trim();
}

function parseJsonPayload(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new OpenAIUpstreamError();
  }
}

export class OpenAIClient {
  private readonly client: OpenAI | null;

  constructor() {
    this.client = env.openaiApiKey
      ? new OpenAI({ apiKey: env.openaiApiKey, timeout: 90_000 })
      : null;
  }

  get configured() {
    return Boolean(this.client);
  }

  requireConfigured() {
    if (!this.client) throw new OpenAINotConfiguredError();
    return this.client;
  }

  async completeJson<T>(options: CompleteJsonOptions<T>): Promise<T> {
    const client = this.requireConfigured();

    try {
      const response = await client.responses.create({
        model: options.model,
        instructions: options.instructions,
        input: options.input,
        store: false,
        reasoning: { effort: options.effort },
        text: {
          verbosity: options.verbosity ?? "medium",
          format: {
            type: "json_schema",
            name: options.schemaName,
            strict: true,
            schema: options.schema,
          },
        },
        tools: options.webSearch ? [{ type: "web_search" }] : undefined,
        safety_identifier: safetyIdentifier(options.userId),
      });

      const text = extractOutputText(response);
      if (!text) throw new OpenAIUpstreamError();
      return options.parse(parseJsonPayload(text));
    } catch (error) {
      throwOpenAIError(error);
    }
  }

  async generateImage(prompt: string): Promise<Buffer> {
    const client = this.requireConfigured();

    try {
      const response = await client.images.generate(
        {
          model: env.openaiModelImage,
          prompt,
          size: "1024x1536",
          quality: "high",
          output_format: "png",
          n: 1,
        },
        { timeout: 180_000 },
      );
      const first = response.data?.[0];
      if (first?.b64_json) return Buffer.from(first.b64_json, "base64");
      if (first?.url) {
        const downloaded = await fetch(first.url);
        if (!downloaded.ok) throw new OpenAIUpstreamError();
        return Buffer.from(await downloaded.arrayBuffer());
      }
      throw new OpenAIUpstreamError();
    } catch (error) {
      throwOpenAIError(error);
    }
  }

  async completeJsonWithImage<T>(options: CompleteJsonOptions<T> & { image: Buffer }): Promise<T> {
    const client = this.requireConfigured();
    const dataUrl = `data:image/png;base64,${options.image.toString("base64")}`;

    try {
      const response = await client.responses.create(
        {
          model: options.model,
          instructions: options.instructions,
          store: false,
          reasoning: { effort: options.effort },
          text: {
            verbosity: options.verbosity ?? "low",
            format: {
              type: "json_schema",
              name: options.schemaName,
              strict: true,
              schema: options.schema,
            },
          },
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: options.input },
                { type: "input_image", image_url: dataUrl, detail: "high" },
              ],
            },
          ],
          safety_identifier: safetyIdentifier(options.userId),
        },
        { timeout: 90_000 },
      );

      const text = extractOutputText(response);
      if (!text) throw new OpenAIUpstreamError();
      return options.parse(parseJsonPayload(text));
    } catch (error) {
      throwOpenAIError(error);
    }
  }
}
