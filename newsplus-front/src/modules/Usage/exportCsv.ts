import type { OpenAICostRow, OpenAISection, OpenAIUsageRow } from "@newsplus/shared";

/** «تصدير CSV»: every usage metric and cost line of the period, one row each (UTF-8 with BOM, formula-safe). */
export function exportCSV(usage: Record<string, OpenAISection<OpenAIUsageRow[]>>, costs: OpenAICostRow[] | null, start: string, end: string) {
  const rows: Array<Array<string | number>> = [["date_utc", "category", "model_or_line_item", "metric", "value", "currency", "dimensions"]];
  for (const [category, section] of Object.entries(usage)) for (const row of section.data ?? []) for (const [metric, value] of Object.entries(row.metrics)) rows.push([row.date, category, row.model ?? "", metric, value, "", JSON.stringify(row.dimensions)]);
  for (const row of costs ?? []) rows.push([row.date, "costs", row.lineItem, "amount", row.amount, row.currency, row.projectId ?? ""]);
  const escape = (value: string | number) => `"${String(typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(new Blob(["﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `openai-usage-${start}-${end}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The export has something to write (the old page's rule). */
export function hasExportData(data: { usage?: Record<string, OpenAISection<OpenAIUsageRow[]>>; costs?: OpenAISection<OpenAICostRow[]> } | undefined) {
  return Boolean(data && (Object.values(data.usage ?? {}).some((section) => section.data?.length) || data.costs?.data?.length));
}
