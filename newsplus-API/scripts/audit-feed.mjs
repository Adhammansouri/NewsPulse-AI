/**
 * Audit all news sources: RSS fetch health + clustering coverage.
 * Run: npx tsx scripts/audit-feed.mjs
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";
import { NEWS_SOURCES } from "../src/config/newsSources.ts";

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 100;
const SIMILARITY = 0.28;
const MIN_PER_SOURCE = 2;
const parser = new Parser({ timeout: 18_000, headers: { "User-Agent": "Newsplus/0.1" } });

const ARABIC_MONTHS = {
  يناير: 0, فبراير: 1, مارس: 2, أبريل: 3, ابريل: 3, مايو: 4, يونيو: 5,
  يوليو: 6, أغسطس: 7, اغسطس: 7, سبتمبر: 8, أكتوبر: 9, اكتوبر: 9, نوفمبر: 10, ديسمبر: 11,
};

function parseFeedDate(isoDate, pubDate) {
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

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "after", "over", "into",
  "في", "من", "على", "إلى", "عن", "أن", "ما", "هو", "هي", "بعد", "قبل", "مع", "كما", "بين",
]);

function normalizeClusterTitle(title) {
  return title
    .replace(/\s*[-|–—]\s*[^-|–—]{2,100}$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(title) {
  const normalized = normalizeClusterTitle(title);
  return new Set(
    normalized
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((t) => t.replace(/^ال/, ""))
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / new Set([...a, ...b]).size;
}

function clusterId(seedTitle) {
  return createHash("sha256").update(seedTitle.toLowerCase()).digest("hex").slice(0, 16);
}

function cluster(items) {
  const used = new Set();
  const groups = [];

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

    const oldest = members.reduce((c, m) => (m.publishedAt < c.publishedAt ? m : c));
    members.sort((a, b) => b.publishedAt - a.publishedAt);
    const primary = members[0];

    groups.push({
      id: clusterId(oldest.title),
      title: primary.title,
      publishedAt: primary.publishedAt,
      sources: members.map((m) => ({ id: m.source.id, name: m.source.name, title: m.title })),
    });
  }

  return groups.sort((a, b) => {
    const recency = b.publishedAt - a.publishedAt;
    if (recency !== 0) return recency;
    return b.sources.length - a.sources.length;
  });
}

function diversifyClusters(clusters) {
  const picked = new Set();
  const result = [];

  for (const source of NEWS_SOURCES) {
    const matches = clusters.filter(
      (item) => !picked.has(item.id) && item.sources.some((s) => s.id === source.id),
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
      const recency = b.publishedAt - a.publishedAt;
      if (recency !== 0) return recency;
      return b.sources.length - a.sources.length;
    })
    .slice(0, MAX_ITEMS);
}

async function fetchSource(source, cutoff) {
  const feed = await parser.parseURL(source.rssUrl);
  const items = [];
  let skippedDate = 0;

  for (const item of feed.items ?? []) {
    const title = item.title?.trim();
    const link = item.link?.trim();
    if (!title || !link) continue;
    const publishedAt = parseFeedDate(item.isoDate, item.pubDate);
    if (!publishedAt || publishedAt < cutoff) {
      skippedDate += 1;
      continue;
    }
    items.push({
      source,
      title,
      link,
      publishedAt,
    });
    if (items.length >= 20) break;
  }

  return {
    total: feed.items?.length ?? 0,
    kept: items.length,
    skippedDate,
    newest: items[0]?.publishedAt ?? 0,
    sample: items[0]?.title?.slice(0, 70) ?? "",
    items,
  };
}

const cutoff = Date.now() - WINDOW_MS;
const sourceResults = [];
const rawItems = [];

for (const source of NEWS_SOURCES) {
  const start = Date.now();
  try {
    const result = await fetchSource(source, cutoff);
    rawItems.push(...result.items);
    sourceResults.push({
      id: source.id,
      name: source.name,
      language: source.language,
      ok: true,
      ms: Date.now() - start,
      rssTotal: result.total,
      kept: result.kept,
      skippedDate: result.skippedDate,
      newest: result.newest ? new Date(result.newest).toISOString() : null,
      sample: result.sample,
    });
  } catch (error) {
    sourceResults.push({
      id: source.id,
      name: source.name,
      language: source.language,
      ok: false,
      ms: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

rawItems.sort((a, b) => b.publishedAt - a.publishedAt);
const clusters = diversifyClusters(cluster(rawItems));

const sourceInFeed = Object.fromEntries(NEWS_SOURCES.map((s) => [s.id, 0]));
for (const item of clusters) {
  for (const s of item.sources) {
    sourceInFeed[s.id] = (sourceInFeed[s.id] ?? 0) + 1;
  }
}

const multiSource = clusters.filter((c) => c.sources.length > 1);
const clusterExamples = multiSource.slice(0, 8).map((c) => ({
  title: c.title.slice(0, 90),
  sourceCount: c.sources.length,
  sources: c.sources.map((s) => s.name),
  titles: c.sources.map((s) => s.title.slice(0, 60)),
}));

// Stories that should cluster across EN outlets (Abraham Lincoln Thailand)
const lincoln = clusters.filter((c) =>
  /lincoln|abraham|تايلاند|thailand|باتايا|pattaya/i.test(c.title) ||
  c.sources.some((s) => /lincoln|تايلاند|thailand|باتايا|pattaya/i.test(s.title)),
);

const report = {
  at: new Date().toISOString(),
  rawItems: rawItems.length,
  clusters: clusters.length,
  multiSourceClusters: multiSource.length,
  sourcesOk: sourceResults.filter((r) => r.ok).length,
  sourcesFailed: sourceResults.filter((r) => !r.ok).length,
  sourceResults,
  sourceInFeed,
  sourcesWithZeroInFeed: Object.entries(sourceInFeed).filter(([, n]) => n === 0).map(([id]) => id),
  clusterExamples,
  lincolnClusters: lincoln.map((c) => ({
    title: c.title.slice(0, 90),
    sourceCount: c.sources.length,
    sources: c.sources.map((s) => s.name),
  })),
};

const outDir = dirname(fileURLToPath(import.meta.url));
const outPath = join(outDir, "audit-feed-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("=== SOURCE FETCH ===");
for (const r of sourceResults) {
  const status = r.ok ? `OK kept=${r.kept}/${r.rssTotal}` : `FAIL ${r.error}`;
  const inFeed = sourceInFeed[r.id] ?? 0;
  console.log(`${r.ok ? "✓" : "✗"} ${r.id.padEnd(16)} ${status.padEnd(40)} inFeed=${inFeed} ${r.ms}ms`);
}

console.log("\n=== SUMMARY ===");
console.log(`Raw: ${rawItems.length} | Clusters: ${clusters.length} | Multi-source: ${multiSource.length}`);
console.log(`Sources OK: ${report.sourcesOk}/${NEWS_SOURCES.length}`);
console.log(`Zero in feed: ${report.sourcesWithZeroInFeed.join(", ") || "none"}`);

console.log("\n=== CLUSTER EXAMPLES ===");
for (const ex of clusterExamples) {
  console.log(`[${ex.sourceCount}] ${ex.sources.join(" + ")}`);
  console.log(`    ${ex.title}`);
}

console.log(`\nReport: ${outPath}`);
