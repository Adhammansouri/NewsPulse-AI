// «الموضوعات الصاعدة» / «صاعد دلوقتي» (S13 §4): computed from the feed alone. Per topic, the headlines of the last
// 3 hours in 6 buckets of 30 minutes (the `spark` bars), compared with the 3 hours before. UI copy is verbatim from
// docs/redesign/design/reference/NewDigest.dc.html, MobNewDigest.dc.html and the sprint.
import type { NewsFeedItem, NewsTopic } from "@newsplus/shared";
import { HEADLINES } from "@/modules/News/wire/copy";
import { topicLabel } from "@/modules/News/wire/rows";
import { countPhrase, type CountForms } from "@/utils/arabic";

const MINUTE_MS = 60_000;
export const TREND_BUCKET_MS = 30 * MINUTE_MS;
export const TREND_BUCKETS = 6;
/** The window the panel reports on: 6 × 30 minutes. */
export const TREND_WINDOW_MS = TREND_BUCKETS * TREND_BUCKET_MS;
/** NewDigest draws 4 rows. */
export const TREND_ROWS = 4;
/** MobNewDigest draws 5 bars per card (the last 5 buckets); NewDigest draws all 6. */
export const MOB_SPARK_BARS = 5;
/** Bar heights as the boards draw them: 4px for the quietest bucket … 21px for the busiest (`spark` is 22px). */
export const SPARK_MIN_PX = 4;
export const SPARK_MAX_PX = 21;

/** «↑ ٣ أضعاف» from this ratio; above `RISING` → «↑». */
const MULTIPLE = 2;
const RISING = 1.15;

/** «٣ أضعاف», «ضعفين» (count grammar, GLOBAL-RULES §4). */
const TIMES: CountForms = { one: "ضعف واحد", two: "ضعفين", few: "{n} أضعاف", many: "{n} ضعف" };

export type TrendTopic = {
  topic: NewsTopic;
  /** «اقتصاد». */
  name: string;
  /** Headlines in the last 3 hours. */
  count: number;
  /** Headlines in the 3 hours before. */
  previous: number;
  /** Oldest → newest, 6 × 30 minutes. */
  buckets: number[];
  /** `count / previous`; null without previous headlines. */
  ratio: number | null;
  /** «↑ ٣ أضعاف» · «↑» · «↑ جديد» · «ثابت». */
  label: string;
  /** Any label but «ثابت». */
  rising: boolean;
};

function trendLabel(count: number, previous: number): { ratio: number | null; label: string; rising: boolean } {
  if (previous === 0) return { ratio: null, label: "↑ جديد", rising: true };
  const ratio = count / previous;
  if (ratio >= MULTIPLE) return { ratio, label: `↑ ${countPhrase(Math.round(ratio), TIMES)}`, rising: true };
  if (ratio > RISING) return { ratio, label: "↑", rising: true };
  return { ratio, label: "ثابت", rising: false };
}

/**
 * Topics with headlines in the last 3 hours, busiest first (ties: the higher ratio), at most `TREND_ROWS`.
 * «أخرى» (`other`) is not a topic and is left out.
 */
export function trendingTopics(items: readonly NewsFeedItem[], now: number): TrendTopic[] {
  const start = now - TREND_WINDOW_MS;
  const before = start - TREND_WINDOW_MS;
  const stats = new Map<NewsTopic, { buckets: number[]; previous: number }>();

  for (const item of items) {
    if (item.topic === "other") continue;
    const at = Date.parse(item.publishedAt);
    if (!Number.isFinite(at) || at < before) continue;
    const entry = stats.get(item.topic) ?? { buckets: new Array<number>(TREND_BUCKETS).fill(0), previous: 0 };
    stats.set(item.topic, entry);
    if (at < start) {
      entry.previous += 1;
      continue;
    }
    // A clock a little ahead of ours still counts in the newest bucket.
    const index = Math.min(TREND_BUCKETS - 1, Math.floor((at - start) / TREND_BUCKET_MS));
    entry.buckets[index] += 1;
  }

  const topics: TrendTopic[] = [];
  for (const [topic, { buckets, previous }] of stats) {
    const count = buckets.reduce((sum, n) => sum + n, 0);
    if (count === 0) continue;
    topics.push({ topic, name: topicLabel(topic), count, previous, buckets, ...trendLabel(count, previous) });
  }
  // «↑ جديد» (no ratio) ranks above any ratio on equal counts.
  const rank = (topic: TrendTopic) => topic.ratio ?? Number.MAX_VALUE;
  return topics.sort((a, b) => b.count - a.count || rank(b) - rank(a)).slice(0, TREND_ROWS);
}

/** Bar heights in px, on one scale for every row shown (the busiest bucket draws the tallest bar). */
export function sparkHeights(buckets: readonly number[], busiest: number): number[] {
  return buckets.map((n) =>
    busiest > 0 ? Math.round(SPARK_MIN_PX + (n / busiest) * (SPARK_MAX_PX - SPARK_MIN_PX)) : SPARK_MIN_PX,
  );
}

export function busiestBucket(topics: readonly TrendTopic[]): number {
  return topics.reduce((max, topic) => Math.max(max, ...topic.buckets), 0);
}

/** Desktop row meta: «١٢ عنوان · آخر ٣ ساعات». */
export function trendMeta(count: number): string {
  return `${countPhrase(count, HEADLINES)} · آخر ٣ ساعات`;
}

/** Mobile card meta: «١٢ عنوان». */
export function trendCount(count: number): string {
  return countPhrase(count, HEADLINES);
}

/**
 * «الاقتصاد واخد ٣ أضعاف عناوينه المعتادة النهارده. منشور تفسيري ممكن ينجح.» — for the row with the highest ratio,
 * only when some ratio reaches 2. The topic takes the article, as on the board («اقتصاد» → «الاقتصاد»).
 */
export function trendInsight(topics: readonly TrendTopic[]): string | null {
  let top: TrendTopic | null = null;
  for (const topic of topics) {
    if (topic.ratio !== null && topic.ratio >= MULTIPLE && (!top || topic.ratio > (top.ratio ?? 0))) top = topic;
  }
  if (!top || top.ratio === null) return null;
  const name = top.name.startsWith("ال") ? top.name : `ال${top.name}`;
  return `${name} واخد ${countPhrase(Math.round(top.ratio), TIMES)} عناوينه المعتادة النهارده. منشور تفسيري ممكن ينجح.`;
}
