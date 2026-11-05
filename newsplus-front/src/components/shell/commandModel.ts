// S11 command palette (NewCmdK) and shortcuts sheet (NewShortcuts): their copy, verbatim from
// docs/redesign/design/reference/NewCmdK.dc.html and NewShortcuts.dc.html, and the palette's view model — query
// matching, the <mark> highlight, and the three groups built from real data (the feed, the drafts, the pages).
// Pure: scripts/check-hotkeys.mjs runs it in node.
import type { EditorialConversationSummary, NewsFeedItem } from "@newsplus/shared";
import type { PaletteFormat } from "@/hooks/hotkeyActions";
import { GO_KEYS, type GoPage } from "@/hooks/hotkeys";
import { hasArabic } from "@/modules/News/newsFormat";
import { ARCHIVE_ROUTE, FORMAT_LABEL } from "@/modules/News/studio/archive/archiveModel";
import { SOURCES } from "@/modules/News/studio/formats";
import type { IconName } from "@/ui/icons";
import { countPhrase, relativeTimeAr, toArabicDigits } from "@/utils/arabic";

export const PALETTE_COPY = {
  label: "لوحة الأوامر",
  results: "نتائج",
  actions: "أفعال بالمحرّر",
  headlines: "عناوين",
  pages: "انتقال",
  writeSocial: "اكتب منشور سوشيال عن ",
  writeVideo: "سكريبت فيديو عن ",
  /** formats.ts `F.video.hint`, as NewCmdK writes it. */
  videoMeta: "هوك + نص + لقطات",
  briefing: "موجز الساعة",
  briefingMeta: "أهم ٥ عناوين الآن",
  latestBreaking: "آخر عاجل",
  breaking: "عاجل",
  draft: "مسودة",
  navigate: "للتنقل",
  run: "للتنفيذ",
  allShortcuts: "كل الاختصارات",
  noResults: (query: string) => `مفيش نتائج لـ «${query}»`,
} as const;

export const SHEET_COPY = {
  title: "اختصارات الكيبورد",
  close: "اقفل",
  tip: "الصحفي اللي بيستخدم الكيبورد يقدر يروح من عاجل لمنشور جاهز من غير ما يلمس الماوس: J ← F 1 ← Ctrl ↵ ← C",
} as const;

/** The pages of `G` + key: the palette's «انتقال» rows and the sheet's «التنقل». */
export const GO_PAGES: Record<GoPage, { label: string; icon: IconName; route: string }> = {
  home: { label: "الرئيسية", icon: "home", route: "/" },
  news: { label: "الأخبار", icon: "news", route: "/news" },
  workflow: { label: "سير العمل", icon: "board", route: "/board" },
  archive: { label: "الأرشيف", icon: "history", route: ARCHIVE_ROUTE },
  usage: { label: "استهلاك الذكاء الاصطناعي", icon: "chart", route: "/usage" },
};

export const GO_ORDER: readonly GoPage[] = ["home", "news", "workflow", "archive", "usage"];

/** `G` + the page's letter. */
export function goKeys(page: GoPage): string[] {
  const letter = Object.keys(GO_KEYS).find((key) => GO_KEYS[key] === page) ?? "";
  return ["G", letter];
}

export type ShortcutRow = { label: string; keys: string[]; flag?: "publishCheck" | "workflow" };
export type ShortcutGroup = { title: string; rows: ShortcutRow[] };

/** NewShortcuts: four groups in a two-column grid, in the board's order. */
export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: "في كل مكان",
    rows: [
      { label: "لوحة الأوامر", keys: ["Ctrl", "K"] },
      { label: "البحث في العناوين", keys: ["/"] },
      { label: "الاختصارات دي", keys: ["?"] },
      { label: "الوضع الداكن", keys: ["Shift", "D"] },
    ],
  },
  {
    title: "العناوين",
    rows: [
      { label: "الخبر اللي بعده / قبله", keys: ["J", "K"] },
      { label: "افتح الخبر", keys: ["↵"] },
      { label: "موجز الساعة", keys: ["B"] },
      { label: "صفّي حسب الوقت", keys: ["1", "–", "5"] },
    ],
  },
  {
    title: "الكتابة",
    rows: [
      { label: "اختار الصيغة", keys: ["F", "1–7"] },
      { label: "اكتب بالمحرّر", keys: ["Ctrl", "↵"] },
      { label: "نسخ الكل", keys: ["C"] },
      { label: "فحص قبل النشر", keys: ["P"], flag: "publishCheck" },
    ],
  },
  {
    title: "التنقل",
    rows: [
      { label: "الرئيسية", keys: ["G", "H"] },
      { label: "الأخبار", keys: ["G", "N"] },
      { label: "سير العمل", keys: ["G", "W"], flag: "workflow" },
      { label: "الأرشيف", keys: ["G", "A"] },
    ],
  },
];

/* ---------- Matching ---------- */

/** Harakat, Quranic marks and the tatweel: ignored when matching. */
const IGNORED = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/;
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

function foldChar(ch: string): string {
  if (IGNORED.test(ch)) return "";
  switch (ch) {
    case "أ":
    case "إ":
    case "آ":
    case "ٱ":
      return "ا";
    case "ى":
      return "ي";
    case "ة":
      return "ه";
  }
  const digit = ARABIC_INDIC.indexOf(ch);
  if (digit !== -1) return String(digit);
  return ch.toLowerCase();
}

/**
 * The text as it is matched — alef forms, ى/ي and ة/ه folded, harakat and tatweel dropped, Latin lower-cased,
 * Arabic-Indic digits as 0-9 — with `map[i]` the index in `text` of the folded character `i`.
 */
export function foldText(text: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    for (const ch of foldChar(text[index])) {
      folded += ch;
      map.push(index);
    }
  }
  return { folded, map };
}

/** The query's words, folded. */
export function queryTokens(query: string): string[] {
  return foldText(query).folded.split(/\s+/).filter(Boolean);
}

/** Every word of the query appears in the text (any order). No words → everything matches. */
export function matchesQuery(text: string, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const { folded } = foldText(text);
  return tokens.every((token) => folded.includes(token));
}

export type Segment = { text: string; mark: boolean };

/** `text` cut into plain and `<mark>` runs: every occurrence of every word of the query. */
export function highlight(text: string, query: string): Segment[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0 || !text) return text ? [{ text, mark: false }] : [];
  const { folded, map } = foldText(text);
  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    let from = folded.indexOf(token);
    while (from !== -1) {
      ranges.push([map[from], map[from + token.length - 1] + 1]);
      from = folded.indexOf(token, from + token.length);
    }
  }
  if (ranges.length === 0) return [{ text, mark: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  const segments: Segment[] = [];
  let at = 0;
  for (const [start, end] of merged) {
    if (start > at) segments.push({ text: text.slice(at, start), mark: false });
    segments.push({ text: text.slice(start, end), mark: true });
    at = end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), mark: false });
  return segments;
}

/* ---------- The palette ---------- */

export type PaletteRun =
  /** `story` null: written from the typed text. */
  | { type: "write"; format: PaletteFormat; story: NewsFeedItem | null; text: string }
  | { type: "briefing" }
  | { type: "item"; item: NewsFeedItem }
  | { type: "draft"; id: string }
  | { type: "go"; page: GoPage };

export type PaletteOption = {
  key: string;
  icon: IconName;
  /** `ic-wrap--ai`: «أفعال بالمحرّر». */
  ai: boolean;
  title: Segment[];
  /** An English headline. */
  dir?: "ltr";
  meta: string | null;
  /** The combo on the row (LTR), or null for a headline (no keys). */
  keys: string[] | null;
  run: PaletteRun;
  /** An AI action during the AI rate-limit cooldown (S10): it does nothing. */
  disabled: boolean;
};

export type PaletteGroupKey = "actions" | "headlines" | "pages";
export type PaletteGroup = { key: PaletteGroupKey; label: string; options: PaletteOption[] };
export type PaletteModel = { groups: PaletteGroup[]; options: PaletteOption[]; noResults: string | null };

/** NewCmdK draws two headlines (a story, a draft); one more fits the 900px desktop with every page listed. */
export const HEADLINE_LIMIT = 3;
const FEED_FIRST = 2;

/** «آخر عاجل · العربية ومصدرين» — the story the write action uses. */
export function storyMeta(item: NewsFeedItem): string | null {
  const parts: string[] = [];
  if (item.breaking) parts.push(PALETTE_COPY.latestBreaking);
  const lead = item.sources[0]?.name;
  const others = item.sources.length - 1;
  if (lead) parts.push(others > 0 ? `${lead} و${countPhrase(others, SOURCES)}` : lead);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** «العربية +٢ · قبل ٣ دقائق · عاجل». */
export function headlineMeta(item: NewsFeedItem, now: Date): string {
  const lead = item.sources[0]?.name ?? "";
  const others = item.sources.length - 1;
  const source = others > 0 ? `${lead} +${toArabicDigits(others)}` : lead;
  return [source, relativeTimeAr(item.publishedAt, now), item.breaking ? PALETTE_COPY.breaking : ""].filter(Boolean).join(" · ");
}

/** «مسودة · منشور سوشيال · قبل ساعتين». */
export function draftMeta(draft: EditorialConversationSummary, now: Date): string {
  const format = (FORMAT_LABEL[draft.format] ?? FORMAT_LABEL.desk).name;
  return [PALETTE_COPY.draft, format, relativeTimeAr(draft.updatedAt, now)].filter(Boolean).join(" · ");
}

/** Up to `limit` headlines: stories first (at most two while drafts wait), then drafts, the rest filled from either. */
export function pickHeadlines<F, D>(feed: readonly F[], drafts: readonly D[], limit = HEADLINE_LIMIT): { feed: F[]; drafts: D[] } {
  let feedCount = Math.min(feed.length, drafts.length > 0 ? FEED_FIRST : limit);
  const draftCount = Math.min(drafts.length, limit - feedCount);
  feedCount = Math.min(feed.length, limit - draftCount);
  return { feed: feed.slice(0, feedCount), drafts: drafts.slice(0, draftCount) };
}

function titleDir(text: string): "ltr" | undefined {
  return text && !hasArabic(text) ? "ltr" : undefined;
}

export type PaletteInput = {
  query: string;
  /** The story open in the newsroom (none off /news). */
  story: NewsFeedItem | null;
  /** The wire's feed, newest first. */
  feed: readonly NewsFeedItem[];
  /** The archive's drafts, newest first. */
  drafts: readonly EditorialConversationSummary[];
  /** The pages this user can go to, in order. */
  pages: readonly GoPage[];
  now: Date;
  /** S10: the AI rate-limit cooldown is running. */
  aiBlocked: boolean;
};

/**
 * NewCmdK's groups. Empty query: the write actions for the open story, «موجز الساعة», the latest headlines and
 * every page. A query: the write actions about it (with the open story when its title matches, else from the text)
 * and «موجز الساعة», then the matching headlines and the matching pages (every page when none matches, as the board
 * keeps «انتقال»); with no matching headline or page, the «مفيش نتائج» line follows the actions.
 */
export function buildPalette({ query, story, feed, drafts, pages, now, aiBlocked }: PaletteInput): PaletteModel {
  const text = query.trim().replace(/\s+/g, " ");
  const tokens = queryTokens(text);
  const groups: PaletteGroup[] = [];

  const actions: PaletteOption[] = [];
  const subjectStory = story && matchesQuery(story.title, tokens) ? story : null;
  if (text || subjectStory) {
    const subject: Segment[] = text ? [{ text, mark: true }] : [{ text: subjectStory?.title ?? "", mark: false }];
    const write = (format: PaletteFormat): PaletteRun => ({ type: "write", format, story: subjectStory, text });
    actions.push({
      key: "write-social",
      icon: "sparkle",
      ai: true,
      title: [{ text: PALETTE_COPY.writeSocial, mark: false }, ...subject],
      meta: subjectStory ? storyMeta(subjectStory) : null,
      keys: ["↵"],
      run: write("social"),
      disabled: aiBlocked,
    });
    actions.push({
      key: "write-video",
      icon: "layers",
      ai: true,
      title: [{ text: PALETTE_COPY.writeVideo, mark: false }, ...subject],
      meta: PALETTE_COPY.videoMeta,
      keys: ["Ctrl", "↵"],
      run: write("video"),
      disabled: aiBlocked,
    });
  }
  // NewCmdK keeps «موجز الساعة» under a query it does not match: the three AI actions are always on offer.
  actions.push({
    key: "briefing",
    icon: "bolt",
    ai: true,
    title: highlight(PALETTE_COPY.briefing, text),
    meta: PALETTE_COPY.briefingMeta,
    keys: ["B"],
    run: { type: "briefing" },
    disabled: aiBlocked,
  });
  groups.push({ key: "actions", label: PALETTE_COPY.actions, options: actions });

  const picked = pickHeadlines(
    feed.filter((item) => matchesQuery(item.title, tokens)),
    drafts.filter((draft) => matchesQuery(draft.title, tokens)),
  );
  const headlines: PaletteOption[] = [
    ...picked.feed.map(
      (item): PaletteOption => ({
        key: `item-${item.id}`,
        icon: "news",
        ai: false,
        title: highlight(item.title, text),
        dir: titleDir(item.title),
        meta: headlineMeta(item, now),
        keys: null,
        run: { type: "item", item },
        disabled: false,
      }),
    ),
    ...picked.drafts.map(
      (draft): PaletteOption => ({
        key: `draft-${draft.id}`,
        icon: "news",
        ai: false,
        title: highlight(draft.title, text),
        dir: titleDir(draft.title),
        meta: draftMeta(draft, now),
        keys: null,
        run: { type: "draft", id: draft.id },
        disabled: false,
      }),
    ),
  ];
  if (headlines.length > 0) groups.push({ key: "headlines", label: PALETTE_COPY.headlines, options: headlines });

  const matchingPages = pages.filter((page) => matchesQuery(GO_PAGES[page].label, tokens));
  // NewCmdK keeps «انتقال» under a query no page matches («الفائدة» still lists the pages): navigation stays on offer.
  const nav = (matchingPages.length > 0 ? matchingPages : pages).map(
      (page): PaletteOption => ({
        key: `go-${page}`,
        icon: GO_PAGES[page].icon,
        ai: false,
        title: highlight(GO_PAGES[page].label, text),
        meta: null,
        keys: goKeys(page),
        run: { type: "go", page },
        disabled: false,
      }),
    );
  if (nav.length > 0) groups.push({ key: "pages", label: PALETTE_COPY.pages, options: nav });

  return {
    groups,
    options: groups.flatMap((group) => group.options),
    noResults: text && headlines.length === 0 && matchingPages.length === 0 ? PALETTE_COPY.noResults(text) : null,
  };
}

/** ↑ / ↓ through the options, wrapping at the ends. */
export function moveActive(active: number, count: number, step: 1 | -1): number {
  if (count === 0) return 0;
  return (((active + step) % count) + count) % count;
}
