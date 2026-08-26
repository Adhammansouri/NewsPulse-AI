import { z } from "zod";
import type { JsonSchema } from "./openaiClient.js";

export const newsSummaryOutputSchema = z.object({
  title: z.string(),
  dek: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  sources: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
  language: z.enum(["ar", "en"]),
});

export const newsSummaryJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "dek", "summary", "bullets", "sources", "language"],
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    summary: { type: "string" },
    bullets: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: {
          name: { type: "string" },
          url: { type: "string" },
        },
      },
    },
    language: { type: "string", enum: ["ar", "en"] },
  },
};

export const generateOutputSchema = z.object({
  title: z.string(),
  dek: z.string(),
  body: z.string(),
  language: z.enum(["ar", "en"]),
});

export const generateJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "dek", "body", "language"],
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    body: { type: "string" },
    language: { type: "string", enum: ["ar", "en"] },
  },
};

export const translateOutputSchema = z.object({
  sourceLanguage: z.enum(["ar", "en", "other"]),
  targetLanguage: z.enum(["ar", "en"]),
  original: z.string(),
  translated: z.string(),
});

export const translateJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sourceLanguage", "targetLanguage", "original", "translated"],
  properties: {
    sourceLanguage: { type: "string", enum: ["ar", "en", "other"] },
    targetLanguage: { type: "string", enum: ["ar", "en"] },
    original: { type: "string" },
    translated: { type: "string" },
  },
};
