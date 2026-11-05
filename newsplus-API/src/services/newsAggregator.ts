import { createHash } from "node:crypto";
import Parser from "rss-parser";
import type { FastifyBaseLogger } from "fastify";
import { NEWS_SOURCES, type NewsSourceConfig } from "../config/newsSources.js";
import { classifyNewsTopic, type NewsTopic } from "./newsTopics.js";
import type { StoryObservation } from "./storyUpdatesStore.js";

/** S14: receives every refresh's stories with each source's own headline, excerpt and link (StoryUpdatesStore). */
export type StoryRecorder = { record(stories: StoryObservation[]): unknown };

const REFRESH_MS = 2 * 60 * 1000;
const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const BREAKING_MS = 2 * 60 * 60 * 1000;
const MAX_ITEMS = 100;
const SIMILARITY = 0.28;
const MIN_PER_SOURCE = 2;
const PARSER_TIMEOUT_MS = 18_000;

const ARABIC_MONTHS: Record<string, number> = {
  يناير: 0,
  فبراير: 1,
  مارس: 2,
  أبريل: 3,
  ابريل: 3,
  مايو: 4,
  يونيو: 5,
  يوليو: 6,
  أغسطس: 7,
  اغسطس: 7,
  سبتمبر: 8,
  أكتوبر: 9,
  اكتوبر: 9,
  نوفمبر: 10,
  ديسمبر: 11,
};

function parseFeedDate(isoDate?: string, pubDate?: string) {
  for (const raw of [isoDate, pubDate]) {
    if (!raw) continue;
    const native = Date.parse(raw);
    if (Number.isFinite(native) && native > 0) return native;

    const match = raw.match(/(\d{1,2})\s+(\S+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?\s*([صم])?/);
    if (!match) continue;
    const month = ARABIC_MONTHS[match[2]];
    if (month == null) continue;
    let hour = Number(match[4] ?? 0);
    const minute = Number(match[5] ?? 0);
    if (match[6] === "م" && hour < 12) hour += 12;
    if (match[6] === "ص" && hour === 12) hour = 0;
    return new Date(Number(match[3]), month, Number(match[1]), hour, minute).getTime();
  }
  return 0;
}

function feedExcerpt(item: { contentSnippet?: string; content?: string; summary?: string }) {
  const raw = item.contentSnippet || item.content || item.summary || "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

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
  topic: NewsTopic;
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

const parser = new Parser({
  timeout: PARSER_TIMEOUT_MS,
  headers: { "User-Agent": "Newsplus/0.1" },
});

/** Strip trailing outlet labels so cross-outlet headlines can cluster. */
function normalizeClusterTitle(title: string) {
  return title
    .replace(/\s*[-|–—]\s*[^-|–—]{2,100}$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(title: string) {
  const normalized = normalizeClusterTitle(title);
  return new Set(
    normalized
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

function clusterId(seedTitle: string) {
  return createHash("sha256").update(seedTitle.toLowerCase()).digest("hex").slice(0, 16);
}

function dedupeSourceLinks(links: AggregatedSourceLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.id)) return false;
    seen.add(link.id);
    return true;
  });
}

/** `articles` (S14), when given, receives each story's clustered articles by story id. */
function cluster(items: RawItem[], articles?: Map<string, RawItem[]>): AggregatedItem[] {
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

    const oldest = members.reduce((current, member) =>
      member.publishedAt < current.publishedAt ? member : current,
    );
    members.sort((a, b) => b.publishedAt - a.publishedAt);
    const primary = members[0];
    const publishedAt = new Date(primary.publishedAt).toISOString();
    articles?.set(clusterId(oldest.title), members);

    groups.push({
      id: clusterId(oldest.title),
      title: primary.title,
      excerpt: primary.excerpt,
      publishedAt,
      breaking: Date.now() - primary.publishedAt < BREAKING_MS,
      topic: classifyNewsTopic(primary.title, primary.excerpt),
      sources: dedupeSourceLinks(
        members.map((member) => ({
          id: member.source.id,
          name: member.source.name,
          url: member.link,
        })),
      ),
    });
  }

  return groups.sort((a, b) => {
    const recency = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (recency !== 0) return recency;
    return b.sources.length - a.sources.length;
  });
}

function diversifyClusters(clusters: AggregatedItem[]): AggregatedItem[] {
  const picked = new Set<string>();
  const result: AggregatedItem[] = [];

  for (const source of NEWS_SOURCES) {
    const matches = clusters.filter(
      (item) => !picked.has(item.id) && item.sources.some((link) => link.id === source.id),
    );
    for (const item of matches.slice(0, MIN_PER_SOURCE)) {
      picked.add(item.id);
      result.push(item);
    }
  }

  for (const item of clusters) {
    if (result.length >= MAX_ITEMS) break;
    if (picked.has(item.id)) continue;
    picked.add(item.id);
    result.push(item);
  }

  return result
    .sort((a, b) => {
      const recency = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (recency !== 0) return recency;
      return b.sources.length - a.sources.length;
    })
    .slice(0, MAX_ITEMS);
}

export class NewsAggregator {
  private cache: AggregatedFeed | null = null;
  private inflight: Promise<AggregatedFeed> | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly log: FastifyBaseLogger,
    /** S14: snapshots for «تطور القصة», written after every refresh. */
    private readonly storyRecorder?: StoryRecorder,
  ) {}

  listSources() {
    return NEWS_SOURCES.map(({ id, name, language }) => ({ id, name, language }));
  }

  async start() {
    if (this.timer) return;
    void this.runRefresh().catch((error) => {
      this.log.error({ err: error }, "news initial refresh failed");
    });
    this.timer = setInterval(() => {
      void this.runRefresh().catch((error) => {
        this.log.error({ err: error }, "news background refresh failed");
      });
    }, REFRESH_MS);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
    if (this.cache) return this.cache;
    return this.runRefresh();
  }

  private runRefresh() {
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
    let ok = 0;
    let failed = 0;

    for (const result of collected) {
      if (result.status === "fulfilled") {
        items.push(...result.value);
        ok += 1;
      } else {
        failed += 1;
      }
    }

    this.log.info({ ok, failed, items: items.length }, "news feed refreshed");

    if (items.length === 0) {
      if (this.cache) {
        this.log.warn("news refresh produced no items; keeping last feed");
        return this.cache;
      }
      const empty: AggregatedFeed = { fetchedAt: new Date().toISOString(), items: [] };
      this.cache = empty;
      return empty;
    }

    items.sort((a, b) => b.publishedAt - a.publishedAt);
    const articles = new Map<string, RawItem[]>();
    const feed: AggregatedFeed = {
      fetchedAt: new Date().toISOString(),
      items: diversifyClusters(cluster(items, articles)),
    };
    this.cache = feed;
    this.recordStories(feed.items, articles);
    return feed;
  }

  /** S14: each story's articles, per source, to the snapshot store. A failure there never fails the feed. */
  private recordStories(stories: AggregatedItem[], articles: Map<string, RawItem[]>) {
    if (!this.storyRecorder) return;
    try {
      this.storyRecorder.record(
        stories.map((story) => ({
          itemId: story.id,
          sources: (articles.get(story.id) ?? []).map((article) => ({
            sourceId: article.source.id,
            headline: article.title,
            excerpt: article.excerpt,
            url: article.link,
            publishedAt: article.publishedAt,
          })),
        })),
      );
    } catch (error) {
      this.log.warn({ err: error }, "story updates not recorded");
    }
  }

  private async fetchSource(source: NewsSourceConfig, cutoff: number): Promise<RawItem[]> {
    try {
      const feed = await parser.parseURL(source.rssUrl);
      const items: RawItem[] = [];

      for (const item of feed.items ?? []) {
        const title = item.title?.trim();
        const link = item.link?.trim();
        if (!title || !link) continue;
        const publishedAt = parseFeedDate(item.isoDate, item.pubDate);
        if (!publishedAt || publishedAt < cutoff) continue;
        items.push({
          source,
          title,
          link,
          excerpt: feedExcerpt(item),
          publishedAt,
        });
        if (items.length >= 20) break;
      }

      return items;
    } catch (error) {
      this.log.warn({ err: error, source: source.id }, "news source fetch failed");
      throw error;
    }
  }
}
