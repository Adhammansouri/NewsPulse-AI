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

export const newsRevisionOutputSchema = newsSummaryOutputSchema.extend({
  note: z.string(),
  memoryPropose: z.boolean(),
  memoryInstruction: z.string(),
  memoryRationale: z.string(),
});

export const newsRevisionJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "dek",
    "summary",
    "bullets",
    "sources",
    "language",
    "note",
    "memoryPropose",
    "memoryInstruction",
    "memoryRationale",
  ],
  properties: {
    ...newsSummaryJsonSchema.properties,
    note: { type: "string" },
    memoryPropose: { type: "boolean" },
    memoryInstruction: { type: "string" },
    memoryRationale: { type: "string" },
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

const carouselSlideJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "headline", "banner", "attribution"],
  properties: {
    role: {
      type: "string",
      enum: ["hook", "counter", "evidence", "stake", "quote", "scope", "means", "condition", "beat", "closer"],
    },
    headline: { type: "string" },
    banner: { type: "string" },
    attribution: { type: "string" },
  },
} as const;

export function carouselPlanOutputSchema(count: number) {
  return z.object({
    arc: z.enum(["dispute", "statement", "sequence"]),
    caption: z.string(),
    hashtags: z.array(z.string()).length(3),
    slides: z
      .array(
        z.object({
          role: z.enum(["hook", "counter", "evidence", "stake", "quote", "scope", "means", "condition", "beat", "closer"]),
          headline: z.string(),
          banner: z.string(),
          attribution: z.string(),
        }),
      )
      .length(count),
  });
}

export function carouselPlanJsonSchema(count: number): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["arc", "caption", "hashtags", "slides"],
    properties: {
      arc: { type: "string", enum: ["dispute", "statement", "sequence"] },
      caption: { type: "string" },
      hashtags: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
      slides: { type: "array", minItems: count, maxItems: count, items: carouselSlideJsonSchema },
    },
  };
}

export function carouselRevisionOutputSchema(count: number) {
  return carouselPlanOutputSchema(count).extend({
    note: z.string(),
    memoryPropose: z.boolean(),
    memoryInstruction: z.string(),
    memoryRationale: z.string(),
  });
}

export function carouselRevisionJsonSchema(count: number): JsonSchema {
  const plan = carouselPlanJsonSchema(count);
  return {
    type: "object",
    additionalProperties: false,
    required: [...plan.required, "note", "memoryPropose", "memoryInstruction", "memoryRationale"],
    properties: {
      ...plan.properties,
      note: { type: "string" },
      memoryPropose: { type: "boolean" },
      memoryInstruction: { type: "string" },
      memoryRationale: { type: "string" },
    },
  };
}

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
