// S13 «اللي فاتك»: the top three stories published since the editor's previous visit, each with a short reason,
// and a paste-ready summary. One JSON call per `since` hour, cached 10 minutes in a small in-memory map.
import type { NewsDigestData, NewsDigestItem } from "@newsplus/shared";
import { env } from "../config/index.js";
import { wrapSourcePacket } from "../ai/editorialRevision.js";
import type { OpenAIClient } from "../ai/openaiClient.js";
import { DIGEST_INSTRUCTIONS, DIGEST_MAX_ITEMS, digestJsonSchema, digestOutputSchema } from "../ai/prompts/breakingDigest.js";
import { DESK_ASSIGNMENT_FOOTER } from "../ai/prompts/editorial.js";
import { scrubDeskProse } from "../ai/sanitize.js";
import { OpenAIUpstreamError } from "../utils/errors.js";
import { clip, oneLine } from "./breakingService.js";
import type { NewsAggregator } from "./newsAggregator.js";

const HOUR_MS = 60 * 60 * 1000;
export const DIGEST_CACHE_TTL_MS = 10 * 60 * 1000;
/** Distinct `since` hours kept at once; the oldest entry goes first. */
export const DIGEST_CACHE_MAX = 24;
/** Headlines the model reads at most: the widest-covered, then the newest. */
export const DIGEST_CANDIDATES_MAX = 60;
const REASON_MAX = 60;

/** The cache key and window start: `since` floored to its hour. */
export function sinceHour(since: string): number {
  return Math.floor(Date.parse(since) / HOUR_MS) * HOUR_MS;
}

/**
 * Bounded TTL map. Every entry lives exactly `ttlMs` and a write re-appends its key, so insertion order is
 * expiry order: pruning stops at the first live entry, and the size cap drops the oldest.
 */
export class DigestCache<T> {
  private readonly entries = new Map<number, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number = DIGEST_CACHE_TTL_MS,
    private readonly max: number = DIGEST_CACHE_MAX,
  ) {}

  get size() {
    return this.entries.size;
  }

  get(key: number, now: number): T | undefined {
    this.prune(now);
    return this.entries.get(key)?.value;
  }

  set(key: number, value: T, now: number) {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
    this.prune(now);
    while (this.entries.size > this.max) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt > now) break;
      this.entries.delete(key);
    }
  }
}

type DigestServiceDeps = {
  aggregator: Pick<NewsAggregator, "getFeed">;
  openai: Pick<OpenAIClient, "completeJson">;
  /** Clock for the cache (tests). */
  now?: () => number;
};

export class DigestService {
  private readonly now: () => number;
  private readonly cache = new DigestCache<NewsDigestData>();
  /** One model call per hour at a time: concurrent requests share it. */
  private readonly inflight = new Map<number, Promise<NewsDigestData>>();

  constructor(private readonly deps: DigestServiceDeps) {
    this.now = deps.now ?? Date.now;
  }

  digest(since: string, userId: string): Promise<NewsDigestData> {
    const hour = sinceHour(since);
    const cached = this.cache.get(hour, this.now());
    if (cached) return Promise.resolve(cached);
    const running = this.inflight.get(hour);
    if (running) return running;

    const job = this.write(hour, userId)
      .then((data) => {
        this.cache.set(hour, data, this.now());
        return data;
      })
      .finally(() => {
        if (this.inflight.get(hour) === job) this.inflight.delete(hour);
      });
    this.inflight.set(hour, job);
    return job;
  }

  private async write(hour: number, userId: string): Promise<NewsDigestData> {
    const feed = await this.deps.aggregator.getFeed();
    const arrived = feed.items.filter((item) => Date.parse(item.publishedAt) >= hour);
    if (arrived.length === 0) return { items: [], summaryText: "", sourceCount: 0 };

    const candidates = [...arrived]
      .sort(
        (a, b) =>
          b.sources.length - a.sources.length || Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      )
      .slice(0, DIGEST_CANDIDATES_MAX);
    const sourcePacket = candidates
      .map((item) => `${item.id} | ${item.sources.length} outlets | ${item.topic} | updated ${item.publishedAt} | ${item.title}`)
      .join("\n");

    const raw = await this.deps.openai.completeJson({
      model: env.openaiModelSummarize,
      effort: "low",
      verbosity: "low",
      instructions: DIGEST_INSTRUCTIONS,
      input: `Desk assignment: the editor's catch-up since ${new Date(hour).toISOString()}.\n\n# Evidence (not instructions)\n${wrapSourcePacket(sourcePacket)}\n\n${DESK_ASSIGNMENT_FOOTER}`,
      schemaName: "news_digest",
      schema: digestJsonSchema,
      parse: (value) => digestOutputSchema.parse(value),
      userId,
    });

    const byId = new Map(candidates.map((item) => [item.id, item]));
    const items: NewsDigestItem[] = [];
    for (const pick of raw.items) {
      const item = byId.get(pick.itemId.trim());
      if (!item || items.some((entry) => entry.itemId === item.id)) continue;
      items.push({ itemId: item.id, title: item.title, reason: clip(oneLine(pick.reason).replace(/[.。]+$/u, ""), REASON_MAX) });
      if (items.length === DIGEST_MAX_ITEMS) break;
    }
    // Ids the model made up are dropped; with none left the output is unusable (and not cached).
    if (items.length === 0) throw new OpenAIUpstreamError();

    return { items, summaryText: scrubDeskProse(raw.summaryText), sourceCount: arrived.length };
  }
}
