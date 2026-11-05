import type { OpenAICostRow, OpenAIUsageRow } from "@newsplus/shared";

export const integer = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
export const quantity = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
export const money = (value: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
export const sumMetric = (rows: OpenAIUsageRow[], key: string) => rows.reduce((sum, row) => sum + (row.metrics[key] ?? 0), 0);
// Never sum different currencies as dollars.
export const usdTotal = (rows: OpenAICostRow[]) => rows.every((row) => row.currency === "USD") ? rows.reduce((sum, row) => sum + row.amount, 0) : null;
export function dailySeries(start: string, end: string, rows: OpenAIUsageRow[], costs: OpenAICostRow[]) {
  const result = [];
  for (let time = Date.parse(start); time <= Date.parse(end); time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10);
    const dayRows = rows.filter((row) => row.date === date);
    result.push({ date, tokens: sumMetric(dayRows, "input_tokens") + sumMetric(dayRows, "output_tokens"), requests: sumMetric(dayRows, "num_model_requests"), cost: usdTotal(costs.filter((row) => row.date === date)) });
  }
  return result;
}
export function modelTotals(rows: OpenAIUsageRow[]) {
  const groups = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const key = row.model ?? "غير محدد";
    const metrics = groups.get(key) ?? {};
    for (const [key, value] of Object.entries(row.metrics)) metrics[key] = (metrics[key] ?? 0) + value;
    groups.set(key, metrics);
  }
  return [...groups].map(([model, metrics]) => ({ model, metrics })).sort((a, b) => (b.metrics.num_model_requests ?? 0) - (a.metrics.num_model_requests ?? 0));
}
export function presetRange(preset: string, today = new Date().toISOString().slice(0, 10)) {
  const days = preset === "7d" ? 6 : preset === "30d" ? 29 : 0;
  const start = preset === "month" ? today.slice(0, 7) + "-01" : new Date(Date.parse(today) - days * 86_400_000).toISOString().slice(0, 10);
  return { start, end: today };
}
export const metricLabels: Record<string, string> = {
  num_model_requests: "الطلبات", input_tokens: "توكنز الإدخال", output_tokens: "توكنز الإخراج", input_cached_tokens: "إدخال مخزّن مؤقتاً", input_cache_write_tokens: "كتابة الذاكرة المؤقتة",
  input_audio_tokens: "إدخال صوتي", output_audio_tokens: "إخراج صوتي", input_text_tokens: "إدخال نصي", output_text_tokens: "إخراج نصي", input_image_tokens: "إدخال صور", output_image_tokens: "إخراج صور",
  input_cached_text_tokens: "نص مخزّن مؤقتاً", input_cached_image_tokens: "صور مخزّنة مؤقتاً", input_cached_audio_tokens: "صوت مخزّن مؤقتاً", images: "الصور", characters: "الأحرف", seconds: "ثوانٍ صوتية", usage_bytes: "حجم التخزين (بايت)", num_sessions: "الجلسات", num_calls: "استدعاءات البحث",
};

// ---- Pulse usage screen (S09 §B). Pure helpers: this file is transpiled standalone by scripts/check-openai-usage.mjs.

/** Longest custom period, in days, inclusive (`days < 90` between start and end, as the API schema checks). */
export const MAX_RANGE_DAYS = 90;
const DAY_MS = 86_400_000;

/** `$18.42` — the screen shows dollars with cents. */
export const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
/** `$100` for a round spend limit, `$62.50` otherwise. */
export const usdLimit = (value: number) => Number.isInteger(value) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : usd(value);
/** Tokens in millions with one decimal as on the boards (`3.9M`, `0.6M`); below 0.1M (and from 1B) compact: `45K`, `850`, `1.2B`. */
export const compactTokens = (value: number) => value >= 100_000 && value < 1e9 ? `${(value / 1e6).toFixed(1)}M` : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
/** `1٬248` — Western digits with the Arabic thousands separator, ready for `toArabicDigits`. */
export const groupedInteger = (value: number) => integer(Math.round(value)).replace(/,/g, "٬");

/** Days in `start…end`, both included (UTC dates). */
export const rangeDays = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;

/**
 * The custom period rule (same as the API schema): the end is not before the start, the span stays under
 * `MAX_RANGE_DAYS` and the end is not after today (UTC). `order` = end before start, `span` = anything else.
 */
export function rangeError(start: string, end: string, today = new Date().toISOString().slice(0, 10)): "order" | "span" | null {
  const days = (Date.parse(end) - Date.parse(start)) / DAY_MS;
  if (!Number.isFinite(days) || days < 0) return "order";
  if (days >= MAX_RANGE_DAYS || end > today) return "span";
  return null;
}

/** «أين يذهب الإنفاق؟» buckets of an OpenAI cost line item. */
export type SpendBucket = "text" | "images" | "webSearch";
export function spendBucket(lineItem: string): SpendBucket {
  if (/web[ _-]?search/i.test(lineItem)) return "webSearch";
  if (/image|dall-?e/i.test(lineItem)) return "images";
  return "text";
}
export function spendBuckets(rows: OpenAICostRow[]): Record<SpendBucket, number> {
  const totals: Record<SpendBucket, number> = { text: 0, images: 0, webSearch: 0 };
  for (const row of rows) totals[spendBucket(row.lineItem)] += row.amount;
  return totals;
}
