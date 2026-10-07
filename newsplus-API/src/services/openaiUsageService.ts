import OpenAI from "openai";
import type { OpenAIUsageData, OpenAIUsageQuery, OpenAISection, OpenAIUsageRow, OpenAICostRow, OpenAISpendLimit } from "@newsplus/shared";
import { env } from "../config/index.js";

type Bucket = { start_time: number; results: unknown[] };
type Page = { data: Bucket[]; has_more: boolean; next_page: string | null };
type Params = { start_time: number; end_time: number; bucket_width: "1d"; limit: number; project_ids?: string[]; page?: string };
const categories = ["completions", "images", "embeddings", "moderations", "audioSpeeches", "audioTranscriptions", "vectorStores", "codeInterpreterSessions", "fileSearchCalls", "webSearchCalls"] as const;

function unavailable<T>(status: OpenAISection<T>["status"]): OpenAISection<T> { return { status, data: null }; }
async function section<T>(read: () => Promise<T>): Promise<OpenAISection<T>> {
  try { return { status: "ready", data: await read() }; }
  catch (error) {
    // Never expose upstream messages, headers or keys to the browser/logs.
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    return unavailable(status === 401 || status === 403 ? "unauthorized" : status === 404 ? "not-found" : "unavailable");
  }
}
async function buckets(read: (page?: string) => Promise<Page>): Promise<Bucket[]> {
  const output: Bucket[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let count = 0; count < 100; count++) {
    const page = await read(cursor);
    output.push(...page.data);
    if (!page.has_more) return output;
    if (!page.next_page || seen.has(page.next_page)) throw new Error("Invalid upstream pagination");
    cursor = page.next_page;
    seen.add(cursor);
  }
  throw new Error("Upstream pagination exceeded limit");
}
function usageRows(data: Bucket[]): OpenAIUsageRow[] {
  return data.flatMap((bucket) => bucket.results.map((entry) => {
    const result = entry as Record<string, unknown>;
    const metrics: Record<string, number> = {};
    const dimensions: Record<string, string> = {};
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === "number" && Number.isFinite(value)) metrics[key] = value;
      if (typeof value === "string" && !["object", "model"].includes(key)) dimensions[key] = value;
      if (typeof value === "boolean") dimensions[key] = String(value);
    }
    return { date: new Date(bucket.start_time * 1000).toISOString().slice(0, 10), model: typeof result.model === "string" ? result.model : null, dimensions, metrics };
  }));
}
function costRows(data: Bucket[]): OpenAICostRow[] {
  return data.flatMap((bucket) => bucket.results.map((entry) => {
    const result = entry as { amount?: { value?: number; currency?: string }; line_item?: string; project_id?: string };
    if (!Number.isFinite(result.amount?.value) || !result.amount?.currency) throw new Error("Invalid cost amount");
    return { date: new Date(bucket.start_time * 1000).toISOString().slice(0, 10), amount: result.amount!.value!, currency: result.amount!.currency!.toUpperCase(), lineItem: result.line_item ?? "Other", projectId: result.project_id ?? null };
  }));
}

export class OpenAIUsageService {
  private readonly client: OpenAI | null;
  private readonly cache = new Map<string, { expires: number; value: Promise<OpenAIUsageData> }>();
  constructor(client?: OpenAI | null, private readonly defaultProjectId = env.openaiProjectId) {
    this.client = client === undefined ? (env.openaiAdminKey ? new OpenAI({ adminAPIKey: env.openaiAdminKey, timeout: 15_000, maxRetries: 0 }) : null) : client;
  }
  get(query: OpenAIUsageQuery): Promise<OpenAIUsageData> {
    const projectId = query.project === "organization" ? null : query.project ?? (this.defaultProjectId || null);
    const key = JSON.stringify([query.start, query.end, projectId]);
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expires > now) return cached.value;
    for (const [key, entry] of this.cache) if (entry.expires <= now) this.cache.delete(key);
    if (this.cache.size >= 12) this.cache.delete(this.cache.keys().next().value!);
    const value = this.load(query, projectId);
    this.cache.set(key, { expires: now + 60_000, value });
    return value;
  }
  private async load(query: OpenAIUsageQuery, projectId: string | null): Promise<OpenAIUsageData> {
    const client = this.client;
    const pending = client ? "unavailable" : "not-configured";
    const response: OpenAIUsageData = {
      configured: Boolean(client), fetchedAt: new Date().toISOString(), timezone: "UTC",
      range: { start: query.start, end: query.end }, scope: { projectId }, defaultProjectId: this.defaultProjectId || null,
      projects: unavailable(pending), usage: Object.fromEntries(categories.map((name) => [name, unavailable(pending)])),
      costs: unavailable(pending), monthCosts: unavailable(pending), organizationMonthCosts: unavailable(pending),
      organizationLimit: unavailable(pending), projectLimit: unavailable(projectId ? pending : "project-required"), rateLimits: unavailable(projectId ? pending : "project-required"),
    };
    if (!client) return response;
    const api = client.admin.organization;
    const now = Math.floor(Date.now() / 1000);
    const params: Params = { start_time: Date.parse(query.start) / 1000, end_time: Math.min(Date.parse(query.end) / 1000 + 86_400, now), bucket_width: "1d", limit: 31, ...(projectId ? { project_ids: [projectId] } : {}) };
    const month: Params = { ...params, start_time: Date.parse(new Date().toISOString().slice(0, 7) + "-01") / 1000, end_time: now };
    const readCosts = (range: Params) => section(async () => costRows(await buckets((page) => api.usage.costs({ ...range, group_by: ["line_item", "project_id"], page }))));
    const readLimit = (read: () => Promise<{ threshold_amount: number; currency: string; enforcement: { status: string } }>) => section<OpenAISpendLimit>(async () => {
      const limit = await read();
      return { amount: limit.threshold_amount / 100, currency: limit.currency.toUpperCase(), enforcement: limit.enforcement.status };
    });
    await Promise.all([
      ...categories.map(async (name) => {
        response.usage[name] = await section(async () => usageRows(await buckets((page) => {
          if (name === "vectorStores" || name === "codeInterpreterSessions" || name === "fileSearchCalls") return api.usage[name]({ ...params, page });
          if (name === "images") return api.usage.images({ ...params, group_by: ["model", "size", "source"], page });
          if (name === "completions") return api.usage.completions({ ...params, group_by: ["model", "batch", "service_tier"], page });
          return api.usage[name]({ ...params, group_by: ["model"], page });
        })));
      }),
      (async () => { response.costs = await readCosts(params); })(),
      (async () => { response.monthCosts = await readCosts(month); })(),
      (async () => { response.organizationMonthCosts = projectId ? await readCosts({ ...month, project_ids: undefined }) : await readCosts(month); })(),
      (async () => { response.organizationLimit = await readLimit(() => api.spendLimit.retrieve()); })(),
      (async () => { response.projects = await section(async () => {
        const projects: Array<{ id: string; name: string }> = [];
        for await (const project of api.projects.list({ limit: 100 })) {
          if (project.status === "active") projects.push({ id: project.id, name: project.name ?? project.id });
          if (projects.length > 1000) throw new Error("Too many projects");
        }
        return projects;
      }); })(),
      ...(projectId ? [
        (async () => { response.projectLimit = await readLimit(() => api.projects.spendLimit.retrieve(projectId)); })(),
        (async () => { response.rateLimits = await section(async () => {
          const limits = [];
          for await (const limit of api.projects.rateLimits.listRateLimits(projectId, { limit: 100 })) {
            limits.push({ model: limit.model, requestsPerMinute: limit.max_requests_per_1_minute, tokensPerMinute: limit.max_tokens_per_1_minute, requestsPerDay: limit.max_requests_per_1_day ?? null, imagesPerMinute: limit.max_images_per_1_minute ?? null, audioMegabytesPerMinute: limit.max_audio_megabytes_per_1_minute ?? null, batchTokensPerDay: limit.batch_1_day_max_input_tokens ?? null });
            if (limits.length > 1000) throw new Error("Too many rate limits");
          }
          return limits;
        }); })(),
      ] : []),
    ]);
    response.fetchedAt = new Date().toISOString();
    return response;
  }
}
