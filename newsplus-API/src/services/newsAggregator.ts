import { createHash } from "node:crypto";
import Parser from "rss-parser";
import type { FastifyBaseLogger } from "fastify";
import { NEWS_SOURCES, type NewsSourceConfig } from "../config/newsSources.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const BREAKING_MS = 2 * 60 * 60 * 1000;
const MAX_ITEMS = 40;
const SIMILARITY = 0.32;

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "after", "over", "into",
  "في", "من", "على", "إلى", "عن", "أن", "ما", "هو", "هي", "بعد", "قبل", "مع", "كما", "بين",
]);

export type AggregatedSourceLink = {
  id: string;
  name: string;
  url: string;
};

export type AggregatedItem = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  breaking: boolean;
  sources: AggregatedSourceLink[];
};

export type AggregatedFeed = {
  fetchedAt: string;
  items: AggregatedItem[];
};

type RawItem = {
  source: NewsSourceConfig;
  title: string;
  link: string;
  excerpt: string;
  publishedAt: number;
};

type CacheEntry = {
  expiresAt: number;
  feed: AggregatedFeed;
};

const parser = new Parser({ timeout: 12_000, headers: { "User-Agent": "Newsplus/0.1" } });

function tokenize(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((token) => token.replace(/^ال/, ""))
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / new Set([...a, ...b]).size;
}

function cluster(items: RawItem[]): AggregatedItem[] {
  const used = new Set<number>();
  const groups: AggregatedItem[] = [];

  for (let i = 0; i < items.length; i += 1) {
    if (used.has(i)) continue;
    const seed = items[i];
    const seedTokens = tokenize(seed.title);
    const members = [seed];
    used.add(i);

    for (let j = i + 1; j < items.length; j += 1) {
      if (used.has(j)) continue;
      const candidate = items[j];
      if (jaccard(seedTokens, tokenize(candidate.title)) < SIMILARITY) continue;
      members.push(candidate);
      used.add(j);
    }

    members.sort((a, b) => b.publishedAt - a.publishedAt);
    const primary = members[0];
    const publishedAt = new Date(primary.publishedAt).toISOString();
    const id = createHash("sha256").update(primary.title.toLowerCase()).digest("hex").slice(0, 16);

    groups.push({
      id,
      title: primary.title,
      excerpt: primary.excerpt,
      publishedAt,
      breaking: Date.now() - primary.publishedAt < BREAKING_MS,
      sources: members.map((member) => ({
        id: member.source.id,
        name: member.source.name,
        url: member.link,
      })),
    });
  }

  return groups
    .sort((a, b) => {
      const coverage = b.sources.length - a.sources.length;
      if (coverage !== 0) return coverage;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, MAX_ITEMS);
}

export class NewsAggregator {
  private cache: CacheEntry | null = null;
  private inflight: Promise<AggregatedFeed> | null = null;

  constructor(private readonly log: FastifyBaseLogger) {}

  listSources() {
    return NEWS_SOURCES.map(({ id, name, language }) => ({ id, name, language }));
  }

  async getFeed(sourceId?: string, query?: string): Promise<AggregatedFeed> {
    const feed = await this.loadFeed();
    const needle = query?.trim().toLowerCase();

    return {
      fetchedAt: feed.fetchedAt,
      items: feed.items.filter((item) => {
        if (sourceId && sourceId !== "all" && !item.sources.some((source) => source.id === sourceId)) {
          return false;
        }
        if (!needle) return true;
        return (
          item.title.toLowerCase().includes(needle) ||
          item.excerpt.toLowerCase().includes(needle) ||
          item.sources.some((source) => source.name.toLowerCase().includes(needle))
        );
      }),
    };
  }

  async getItem(itemId: string) {
    const feed = await this.loadFeed();
    return feed.items.find((item) => item.id === itemId) ?? null;
  }

  private async loadFeed() {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.feed;
    if (this.inflight) return this.inflight;

    this.inflight = this.refresh().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async refresh() {
    const cutoff = Date.now() - WINDOW_MS;
    const collected = await Promise.allSettled(NEWS_SOURCES.map((source) => this.fetchSource(source, cutoff)));
    const items: RawItem[] = [];

    for (const result of collected) {
      if (result.status === "fulfilled") items.push(...result.value);
    }

    items.sort((a, b) => b.publishedAt - a.publishedAt);
    const feed: AggregatedFeed = {
      fetchedAt: new Date().toISOString(),
      items: cluster(items),
    };
    this.cache = { feed, expiresAt: Date.now() + CACHE_TTL_MS };
    return feed;
  }

  private async fetchSource(source: NewsSourceConfig, cutoff: number): Promise<RawItem[]> {
    try {
      const feed = await parser.parseURL(source.rssUrl);
      const items: RawItem[] = [];

      for (const item of feed.items ?? []) {
        const title = item.title?.trim();
        const link = item.link?.trim();
        if (!title || !link) continue;
        const publishedAt = new Date(item.isoDate ?? item.pubDate ?? 0).getTime();
        if (!publishedAt || publishedAt < cutoff) continue;
        items.push({
          source,
          title,
          link,
          excerpt: (item.contentSnippet ?? item.content ?? "").replace(/\s+/g, " ").trim().slice(0, 280),
          publishedAt,
        });
        if (items.length >= 20) break;
      }

      return items;
    } catch (error) {
      this.log.warn({ err: error, source: source.id }, "news source fetch failed");
      return [];
    }
  }
}
