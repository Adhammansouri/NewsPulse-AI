// View model of the usage screen (S09 §B): `GET /openai/usage` + query state → the DeskUsage / MobUsage boards.
// Every number comes from the response; a value the response does not carry is `null` and its tile/row is hidden.
import type { OpenAIDataStatus, OpenAIUsageData, OpenAIUsageRow } from "@newsplus/shared";
import { isApiError } from "@/services/apiError";
import { relativeTimeAr, toArabicDigits } from "@/utils/arabic";
import {
  compactTokens,
  dailySeries,
  groupedInteger,
  modelTotals,
  rangeDays,
  spendBuckets,
  sumMetric,
  usd,
  usdLimit,
  usdTotal,
} from "./usageFormat";

export type UsagePreset = "today" | "7d" | "30d" | "month" | "custom";

/** Board states: `ready` (+ the custom card), `loading`, `error`, `setup` (not-configured), `forbidden`. */
export type UsageScreenState =
  | { kind: "loading" }
  | { kind: "ready"; data: OpenAIUsageData }
  | { kind: "setup" }
  | { kind: "forbidden" }
  /** `message`: the status message for `unauthorized` / `unavailable` / `not-found`; null = connection failure. */
  | { kind: "error"; message: string | null };

/** The existing status messages of the usage page, shown as the error text for those statuses. */
const STATUS_MESSAGES: Record<OpenAIDataStatus, string> = {
  ready: "متصل",
  "not-configured": "بانتظار ربط حساب OpenAI",
  unauthorized: "المفتاح لا يملك صلاحية قراءة هذه البيانات",
  unavailable: "تعذر جلب البيانات — حاول التحديث لاحقاً",
  "not-found": "غير متاح لهذا الحساب أو لم يتم إعداد حد",
  "project-required": "اختر مشروعاً لعرض هذه البيانات",
};

/**
 * Status → board (S09 §B). The period cost (`costs`) is the screen's primary section: its status decides the board
 * once the account is connected. 403 always wins (the API refuses non-admins).
 */
export function screenState(query: { data: OpenAIUsageData | undefined; error: unknown; isPending: boolean }): UsageScreenState {
  if (isApiError(query.error) && query.error.status === 403) return { kind: "forbidden" };
  const data = query.data;
  if (data) {
    if (!data.configured) return { kind: "setup" };
    const status = data.costs?.status ?? "unavailable";
    if (status === "ready") return { kind: "ready", data };
    if (status === "not-configured" || status === "project-required") return { kind: "setup" };
    return { kind: "error", message: STATUS_MESSAGES[status] };
  }
  if (query.error) return { kind: "error", message: null };
  return { kind: "loading" };
}

const SYNC_LINES: Record<Exclude<UsageScreenState["kind"], "ready">, string> = {
  loading: "جاري التحميل…",
  error: "غير متصل",
  setup: "الحساب غير مربوط بعد",
  forbidden: "صلاحية غير كافية",
};

/** `p.live` under the title: «متصل بحساب OpenAI · آخر جلب منذ دقيقتين». */
export function syncLine(state: UsageScreenState, now: Date): string {
  if (state.kind !== "ready") return SYNC_LINES[state.kind];
  const when = relativeTimeAr(state.data.fetchedAt, now);
  const since = when.startsWith("قبل ") ? `منذ ${when.slice(4)}` : when;
  return since ? `متصل بحساب OpenAI · آخر جلب ${since}` : "متصل بحساب OpenAI";
}

const COST_LABELS: Record<UsagePreset, string> = {
  today: "تكلفة اليوم",
  "7d": "تكلفة آخر ٧ أيام",
  "30d": "تكلفة آخر ٣٠ يوماً",
  month: "تكلفة هذا الشهر",
  custom: "تكلفة الفترة المحددة",
};

/** Arabic count with Arabic-Indic digits and grouping: `١٬٢٤٨`. */
export const arCount = (value: number) => toArabicDigits(groupedInteger(value));
/** `٣٧٪`. */
export const arPercent = (ratio: number) => `${toArabicDigits(Math.round(ratio * 100))}٪`;

/** Requests of image models: `num_model_requests`, else one per generated image. */
function requestsOf(metrics: Record<string, number>) {
  return metrics.num_model_requests ?? metrics.images ?? 0;
}

function imageRequests(rows: OpenAIUsageRow[]) {
  return rows.reduce((sum, row) => sum + requestsOf(row.metrics), 0);
}

export type CostKpi = {
  label: string;
  /** `$18.42` */
  amount: string;
  /** This month's spend against the monthly limit of the scope; null when the limit or the month cost is unknown. */
  limit: { percent: number; percentLabel: string; limit: string; available: string } | null;
};

export type UsageKpis = {
  cost: CostKpi | null;
  requests: { total: string; average: string } | null;
  tokens: { total: string; cachedShare: string | null } | null;
  slides: string | null;
};

export function usageKpis(data: OpenAIUsageData, preset: UsagePreset): UsageKpis {
  const days = Math.max(1, rangeDays(data.range.start, data.range.end));
  const costRows = data.costs?.data;
  const cost = costRows ? usdTotal(costRows) : null;

  const limitSection = data.scope?.projectId ? data.projectLimit : data.organizationLimit;
  const monthSection = data.scope?.projectId ? data.monthCosts : data.organizationMonthCosts;
  const limit = limitSection?.data;
  const monthCost = monthSection?.data ? usdTotal(monthSection.data) : null;
  const limitInfo =
    limit && limit.currency === "USD" && limit.amount > 0 && monthCost !== null
      ? {
          percent: Math.min(100, (monthCost / limit.amount) * 100),
          percentLabel: arPercent(monthCost / limit.amount),
          limit: usdLimit(limit.amount),
          available: usd(Math.max(0, limit.amount - monthCost)),
        }
      : null;

  const text = data.usage?.completions?.data;
  const images = data.usage?.images?.data;
  // The editor's requests = the models table's «طلبات» column: text model requests + image model requests.
  const requests = text ? sumMetric(text, "num_model_requests") + (images ? imageRequests(images) : 0) : null;
  const input = text ? sumMetric(text, "input_tokens") : 0;
  const output = text ? sumMetric(text, "output_tokens") : 0;
  const cached = text ? sumMetric(text, "input_cached_tokens") : 0;

  return {
    cost: cost === null ? null : { label: COST_LABELS[preset], amount: usd(cost), limit: limitInfo },
    requests: requests === null ? null : { total: arCount(requests), average: arCount(requests / days) },
    tokens: text ? { total: compactTokens(input + output), cachedShare: input + output > 0 ? arPercent(cached / (input + output)) : null } : null,
    slides: images ? arCount(sumMetric(images, "images")) : null,
  };
}

/** Weekday names of the chart (DeskUsage `raw`), Sunday first; MobUsage abbreviates them. */
const WEEKDAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] as const;
const WEEKDAYS_SHORT = ["أح", "ن", "ث", "أر", "خ", "ج", "س"] as const;
/** Over a week, the bars are labelled `d/m` once a week (and «اليوم» on the last). */
const LABEL_EVERY = 7;

export type ChartMetric = "cost" | "tokens";

export type ChartBar = {
  date: string;
  /** Label under the bar («اليوم», weekday, or `d/m` on long periods; "" = no label). */
  day: string;
  /** Value above the bar (desktop): `$1.90` / `3.9M`. */
  value: string;
  /** 0–1 of the period's highest day. */
  ratio: number;
  isToday: boolean;
};

export type UsageChart = { bars: ChartBar[]; max: string; dense: boolean };

/** Daily bars for `metric`, or null when the response lacks that section. */
export function usageChart(
  data: OpenAIUsageData,
  metric: ChartMetric,
  short: boolean,
  today = new Date().toISOString().slice(0, 10),
): UsageChart | null {
  const costs = data.costs?.data;
  const text = data.usage?.completions?.data;
  if (metric === "cost" ? !costs || usdTotal(costs) === null : !text) return null;

  const series = dailySeries(data.range.start, data.range.end, text ?? [], costs ?? []);
  const values = series.map((point) => (metric === "cost" ? (point.cost ?? 0) : point.tokens));
  const max = Math.max(0, ...values);
  const dense = series.length > LABEL_EVERY;
  const names = short ? WEEKDAYS_SHORT : WEEKDAYS;

  const bars = series.map((point, index) => {
    const date = new Date(`${point.date}T00:00:00Z`);
    const isToday = point.date === today;
    const last = series.length - 1;
    // Long periods: a label every week from the first day, none crowding the last day's.
    const labelled = !dense || index === last || (index % LABEL_EVERY === 0 && last - index > LABEL_EVERY / 2);
    const day = isToday
      ? "اليوم"
      : !labelled
        ? ""
        : dense
          ? toArabicDigits(`${date.getUTCDate()}/${date.getUTCMonth() + 1}`)
          : names[date.getUTCDay()];
    const value = values[index];
    return {
      date: point.date,
      day,
      value: metric === "cost" ? usd(value) : compactTokens(value),
      ratio: max > 0 ? value / max : 0,
      isToday,
    };
  });
  return { bars, max: metric === "cost" ? usd(max) : compactTokens(max), dense };
}

export type ModelRow = { model: string; requests: string; input: string | null; output: string | null };

/** «النماذج»: text models (requests, input, output tokens), then image models (requests only). Null without either section. */
export function modelRows(data: OpenAIUsageData): ModelRow[] | null {
  const text = data.usage?.completions?.data;
  const images = data.usage?.images?.data;
  if (!text && !images) return null;
  const textRows = modelTotals(text ?? []).map(({ model, metrics }) => ({
    model,
    requests: arCount(metrics.num_model_requests ?? 0),
    input: compactTokens(metrics.input_tokens ?? 0),
    output: compactTokens(metrics.output_tokens ?? 0),
  }));
  const imageRows = modelTotals(images ?? []).map(({ model, metrics }) => ({
    model,
    requests: arCount(requestsOf(metrics)),
    input: null,
    output: null,
  }));
  return [...textRows, ...imageRows];
}

export type SpendRow = { key: "text" | "images" | "webSearch"; label: string; amount: string; share: number };

const SPEND_LABELS = { text: "النصوص", images: "صور الشرائح", webSearch: "البحث على الويب" } as const;

/** «أين يذهب الإنفاق؟»: the period cost split by line item; null when the cost is missing or not all in USD. */
export function spendRows(data: OpenAIUsageData): SpendRow[] | null {
  const rows = data.costs?.data;
  const total = rows ? usdTotal(rows) : null;
  if (!rows || total === null) return null;
  const buckets = spendBuckets(rows);
  return (Object.keys(SPEND_LABELS) as Array<keyof typeof SPEND_LABELS>).map((key) => ({
    key,
    label: SPEND_LABELS[key],
    amount: usd(buckets[key]),
    share: total > 0 ? (buckets[key] / total) * 100 : 0,
  }));
}

/** The scope select: the organization, then the account's active projects (the current scope kept if unlisted). */
export function scopeOptions(data: OpenAIUsageData | undefined): Array<{ value: string; label: string }> {
  const options = [{ value: "organization", label: "المؤسسة بالكامل" }];
  const projects = data?.projects?.data ?? [];
  const current = data?.scope?.projectId;
  if (current && !projects.some((item) => item.id === current)) options.push({ value: current, label: current });
  for (const item of projects) options.push({ value: item.id, label: item.name });
  return options;
}
