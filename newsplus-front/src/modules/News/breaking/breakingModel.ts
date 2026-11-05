// Breaking mode (S13 §2): links, UI copy and the view model of NewBreaking / MobNewBreaking. UI copy is verbatim
// from docs/redesign/design/reference/NewBreaking.dc.html and MobNewBreaking.dc.html; values in braces come from
// the item and the `/news/breaking` response.
import type { NewsFeedItem } from "@newsplus/shared";
import { clockAr, countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

/** Desktop: the newsroom opens the item in breaking mode with `?item={id}&breaking=1`. */
export const BREAKING_PARAM = "breaking";

export function breakingLink(itemId: string): string {
  return `/news?item=${encodeURIComponent(itemId)}&${BREAKING_PARAM}=1`;
}

/** Mobile: the breaking screen of an item. */
export function breakingPath(itemId: string): string {
  return `/news/${encodeURIComponent(itemId)}/breaking`;
}

export function isBreakingMode(params: URLSearchParams): boolean {
  return params.get(BREAKING_PARAM) === "1";
}

export const BREAKING_COPY = {
  badge: "عاجل",
  sinceFirst: "من أول نشر",
  title: "وضع العاجل",
  post: "منشور عاجل · X",
  ticker: "شريط الأخبار",
  tickerMeta: "سطر واحد",
  alert: "تنبيه للمتابعين",
  copy: "نسخ",
  /** «نسخ» → «تم النسخ» for a moment, as on the other copy buttons (Main, DeskTranslate). */
  copied: "تم النسخ",
  copyFailed: "تعذّر النسخ",
  follow: "تابع القصة تلقائياً",
  autoUpdate: "حدّث الصيغ لما المصادر تضيف تفاصيل",
  autoUpdateLabel: "تحديث تلقائي",
  notifyTeam: "نبّه الفريق إن الخبر اتغطى",
  notifyTeamLabel: "تنبيه الفريق",
  coverage: "التغطية لحد دلوقتي",
  writeDetailed: "اكتب منشور مفصّل",
  back: "رجوع",
  mobReady: "٣ صيغ جاهزة",
  mobAutoUpdate: "حدّث الصيغ لما تيجي تفاصيل",
  mobAutoUpdateHint: "المحرّر بيتابع المصادر",
} as const;

/** X's limit, shown as «١٤٢ / ٢٨٠». */
export const POST_MAX = 280;

const SECONDS: CountForms = { one: "ثانية", two: "ثانيتين", few: "{n} ثوانٍ", many: "{n} ثانية" };
const LETTERS: CountForms = { one: "حرف واحد", two: "حرفين", few: "{n} أحرف", many: "{n} حرف" };

/** Length as X (and the API) count it: code points. */
export function textLength(text: string): number {
  return Array.from(text).length;
}

/** «٠٠:٤٢» — minutes and seconds since the first publish. */
export function elapsedClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return toArabicDigits(`${minutes}:${seconds}`);
}

function wholeSeconds(ms: number): number {
  return Math.max(1, Math.round(ms / 1000));
}

/** «المحرّر جهّز ٣ صيغ قصيرة في ٤ ثوانٍ. انسخ وانشر، والتفاصيل تيجي بعدين.» */
export function readyLine(ms: number): string {
  return `المحرّر جهّز ٣ صيغ قصيرة في ${countPhrase(wholeSeconds(ms), SECONDS)}. انسخ وانشر، والتفاصيل تيجي بعدين.`;
}

/** Desktop `badge--ai`: «جاهز في ٤ ث». */
export function readyBadge(ms: number): string {
  return `جاهز في ${toArabicDigits(wholeSeconds(ms))} ث`;
}

/** Mobile `badge--ai`: «في ٤ ثوانٍ». */
export function mobReadyBadge(ms: number): string {
  return `في ${countPhrase(wholeSeconds(ms), SECONDS)}`;
}

/** «١٤٢ / ٢٨٠». */
export function postCount(post: string): string {
  return `${toArabicDigits(textLength(post))} / ${toArabicDigits(POST_MAX)}`;
}

/** «٦٨ حرف». */
export function alertCount(alert: string): string {
  return countPhrase(textLength(alert), LETTERS);
}

const TRAILING_TAGS = /(?:\s+#[^\s#]+)+\s*$/u;

/** The post as the panel shows it: the text, and its trailing hashtags as `tag`s («#عاجل», «#البنك_المركزي»). */
export function splitPost(post: string): { text: string; tags: string[] } {
  const match = post.match(TRAILING_TAGS);
  if (!match || match.index === undefined || match.index === 0) return { text: post.trim(), tags: [] };
  return { text: post.slice(0, match.index).trim(), tags: match[0].trim().split(/\s+/) };
}

/**
 * The earliest `publishedAt` seen for an item in this session. A feed item carries the time of its newest source,
 * so the time moves forward as sources join; breaking mode counts from the first one the desk saw.
 */
const firstSeen = new Map<string, number>();

export function firstPublishedAt(item: Pick<NewsFeedItem, "id" | "publishedAt">): number {
  const at = Date.parse(item.publishedAt);
  const seen = firstSeen.get(item.id);
  const first = seen === undefined || !Number.isFinite(at) ? (seen ?? at) : Math.min(seen, at);
  if (Number.isFinite(first)) firstSeen.set(item.id, first);
  return first;
}

export type Coverage = {
  /** «أول مصدر: العربية · ٢:٥٢ م». */
  first: string | null;
  /** «أكّده: سكاي، الشرق، Reuters»; null while one source carries the story. */
  confirmed: string | null;
};

/**
 * «التغطية لحد دلوقتي». The feed lists an item's sources newest first, so the last one published first and the
 * others confirmed it, in the order they joined.
 */
export function coverage(item: Pick<NewsFeedItem, "sources">, firstAt: number): Coverage {
  const names = item.sources.map((source) => source.name).filter(Boolean);
  const firstName = names[names.length - 1];
  if (!firstName) return { first: null, confirmed: null };
  const time = Number.isFinite(firstAt) ? ` · ${clockAr(new Date(firstAt))}` : "";
  const others = names.slice(0, -1).reverse();
  return {
    first: `أول مصدر: ${firstName}${time}`,
    confirmed: others.length > 0 ? `أكّده: ${others.join("، ")}` : null,
  };
}

/** «أحمد بيكتب سكريبت فيديو عن نفس الخبر» (the format is left out while the teammate's draft is unknown). */
export function teammateLine(name: string, formatName: string | null): string {
  return formatName ? `${name} بيكتب ${formatName} عن نفس الخبر` : `${name} بيكتب عن نفس الخبر`;
}
