// UI copy of the S04 wire, verbatim from docs/redesign/design/reference (Main, MobWire, MobFilters) and
// docs/redesign/sprints/S04-newsroom-wire.md. Values in braces are filled from real data.
import type { TimeFilter, TopicFilter } from "../newsFormat";
import { countPhrase, type CountForms } from "@/utils/arabic";

/** «٨ عناوين», «عنوانين» — the live line and the sheet's «عرض {N}». */
export const HEADLINES: CountForms = { one: "عنوان واحد", two: "عنوانين", few: "{n} عناوين", many: "{n} عنوان" };

/** «عنوانان جديدان» — the `wire-new` pill. */
export const NEW_HEADLINES: CountForms = {
  one: "عنوان جديد",
  two: "عنوانان جديدان",
  few: "{n} عناوين جديدة",
  many: "{n} عنوان جديد",
};

/** Desktop filter button: Main «تصفية، فلتر واحد مفعّل»; other counts follow the same sentence. */
const ACTIVE_FILTERS: CountForms = {
  one: "فلتر واحد مفعّل",
  two: "فلترين مفعّلين",
  few: "{n} فلاتر مفعّلة",
  many: "{n} فلتر مفعّل",
};

export const COPY = {
  title: "الأخبار",
  loadingLine: "جاري التحميل…",
  offlineLine: "غير متصل بالمصادر",
  refresh: "تحديث العناوين",
  briefing: "موجز الساعة",
  searchLabelDesk: "بحث في العناوين",
  searchLabelMob: "بحث",
  searchPlaceholder: "ابحث في العناوين…",
  filter: "تصفية",
  timeGroup: "الوقت",
  topicGroup: "الموضوع",
  wireLabel: "العناوين",
  breaking: "عاجل",
  draftReady: "مسودة جاهزة",
  errorTitle: "تعذّر جلب العناوين",
  retry: "حاول تاني",
  emptyTitle: "مفيش عناوين هنا",
  clearFilters: "امسح التصفية",
  popoverTitle: "تصفية",
  clearAll: "مسح الكل",
  language: "اللغة",
  sources: "المصادر",
  showResults: "عرض النتائج",
  sheetTitle: "تصفية العناوين",
  closeFilters: "إغلاق التصفية",
  sourceSearchLabel: "ابحث باسم المصدر",
  sourceSearchPlaceholder: "ابحث باسم المصدر…",
  swipeWrite: "اكتب منشور",
  swipePin: "للموجز",
  previousDraftReady: "المسودة السابقة جاهزة في الأرشيف",
  pulling: "جاري جلب أحدث العناوين…",
  studioEmptyTitle: "اختار خبر وابدأ",
  studioEmptyText: "لما تختار خبر من العناوين، هيظهر هنا ومعاه الصيغ اللي المحرّر يقدر يكتبها.",
} as const;

export const LANGUAGE_LABELS = { all: "الكل", ar: "عربي", en: "English" } as const;

/** «مباشر · ٨ عناوين · حُدّث قبل دقيقة» (desktop) / «مباشر · ١٠ عناوين» (mobile). */
export function liveLine(count: number, updated?: string): string {
  const base = `مباشر · ${countPhrase(count, HEADLINES)}`;
  return updated ? `${base} · حُدّث ${updated}` : base;
}

export function filterButtonLabel(active: number): string {
  return active > 0 ? `${COPY.filter}، ${countPhrase(active, ACTIVE_FILTERS)}` : COPY.filter;
}

/** «بتشوف آخر نسخة من ٢:٤٠ م» */
export const savedCopyLine = (clock: string) => `بتشوف آخر نسخة من ${clock}`;

/** MobFilters sticky CTA: «عرض ٤ عناوين». */
export const showCountLabel = (count: number) => `عرض ${countPhrase(count, HEADLINES)}`;

/** MobFilters sources legend: «٢ من ٩». */
export const ofTotal = (selected: string, total: string) => `${selected} من ${total}`;

/**
 * The span each time filter covers, as the empty state and the mobile filter chips name it
 * (MobWire-empty: «آخر ٢٠ دقيقة»; Main-empty: «في آخر ٢٠ دقيقة»; «وسّع الوقت لساعة»).
 */
export const TIME_SPANS: Record<Exclude<TimeFilter, "all">, { chip: string; within: string; widen?: string }> = {
  fresh: { chip: "آخر ٢٠ دقيقة", within: "في آخر ٢٠ دقيقة" },
  hour: { chip: "آخر ساعة", within: "في آخر ساعة", widen: "وسّع الوقت لساعة" },
  three: { chip: "آخر ٣ ساعات", within: "في آخر ٣ ساعات", widen: "وسّع الوقت لـ٣ ساعات" },
  today: { chip: "اليوم", within: "اليوم", widen: "وسّع الوقت لليوم" },
};

/** «وسّع الوقت …» from «اليوم» goes back to every time. */
export const WIDEN_TO_ALL = "وسّع الوقت للكل";

/**
 * Empty state copy, filled from the active filters.
 * Main-empty: «مفيش أخبار اقتصاد في آخر ٢٠ دقيقة من المصادر المختارة. آخر خبر كان قبل ٢٦ دقيقة.»
 * MobWire-empty: «مفيش أخبار اقتصاد في آخر ٢٠ دقيقة. آخر خبر اقتصاد كان قبل ٢٦ دقيقة.» (sprint `{topic}` form)
 * A part whose filter is not active is left out.
 */
export function emptyText({
  mobile,
  topic,
  time,
  sourcesSelected,
  lastSeen,
}: {
  mobile: boolean;
  topic: string | null;
  time: Exclude<TimeFilter, "all"> | null;
  sourcesSelected: boolean;
  lastSeen: string | null;
}): string {
  let first = "مفيش أخبار";
  if (topic) first += ` ${topic}`;
  if (time) first += ` ${TIME_SPANS[time].within}`;
  if (sourcesSelected && !mobile) first += " من المصادر المختارة";
  first += ".";
  if (!lastSeen) return first;
  const last = mobile && topic ? `آخر خبر ${topic} كان ${lastSeen}.` : `آخر خبر كان ${lastSeen}.`;
  return `${first} ${last}`;
}

/** Topic chips in the boards' order (Main `topics`): economy first; «أخرى» last. */
export const WIRE_TOPIC_ORDER: readonly TopicFilter[] = [
  "all",
  "economy",
  "politics",
  "tech",
  "sports",
  "health",
  "science",
  "culture",
  "other",
];
