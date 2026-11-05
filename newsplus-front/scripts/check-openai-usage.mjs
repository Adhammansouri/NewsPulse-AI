import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../src/modules/Usage/usageFormat.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { dailySeries, usdTotal, modelTotals, presetRange, usd, usdLimit, compactTokens, groupedInteger, rangeDays, rangeError, spendBuckets } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const rows = [{ date: "2026-01-01", model: "model", metrics: { input_tokens: 1000, input_cached_tokens: 400, output_tokens: 200, num_model_requests: 2 } }, { date: "2026-01-03", model: "model", metrics: { input_tokens: 500, output_tokens: 50, num_model_requests: 1 } }];
const series = dailySeries("2026-01-01", "2026-01-03", rows, [{ date: "2026-01-01", amount: .125, currency: "USD" }]);
assert.equal(series.length, 3);
assert.equal(series[0].tokens, 1200); // Cached input is a subset, not extra tokens.
assert.deepEqual(series[1], { date: "2026-01-02", tokens: 0, requests: 0, cost: 0 });
assert.equal(usdTotal([{ amount: 1, currency: "EUR" }]), null);
assert.equal(usdTotal([{ amount: .125, currency: "USD" }]), .125);
assert.equal(modelTotals(rows)[0].metrics.input_tokens, 1500);
assert.deepEqual(presetRange("7d", "2026-01-03"), { start: "2025-12-28", end: "2026-01-03" });
assert.deepEqual(presetRange("month", "2026-01-03"), { start: "2026-01-01", end: "2026-01-03" });
// Pulse screen formatting (S09): dollars with cents, compact tokens, Arabic grouping, custom-range rule, spend buckets.
assert.equal(usd(18.4213), "$18.42");
assert.equal(usdLimit(100), "$100");
assert.equal(usdLimit(62.5), "$62.50");
assert.equal(compactTokens(3_912_000), "3.9M");
assert.equal(compactTokens(620_000), "0.6M");
assert.equal(compactTokens(45_000), "45K");
assert.equal(groupedInteger(1248), "1٬248");
assert.equal(rangeDays("2026-01-01", "2026-01-07"), 7);
assert.equal(rangeError("2026-10-20", "2026-10-15", "2026-11-04"), "order");
assert.equal(rangeError("2026-01-01", "2026-03-31", "2026-11-04"), null); // 90 days, both included
assert.equal(rangeError("2026-01-01", "2026-04-01", "2026-11-04"), "span");
assert.equal(rangeError("2026-11-01", "2026-11-05", "2026-11-04"), "span"); // ends after today
assert.deepEqual(spendBuckets([{ lineItem: "gpt-5, input", amount: 2 }, { lineItem: "gpt-image-1, image output", amount: 1 }, { lineItem: "web search tool calls", amount: .5 }]), { text: 2, images: 1, webSearch: .5 });
console.log("OpenAI usage: UTC ranges, gap filling, cached tokens, model totals, currencies and screen formatting passed.");
