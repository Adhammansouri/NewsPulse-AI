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
