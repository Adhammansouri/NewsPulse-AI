// The studio's formats (S05): names, hints and AI action labels from the `F` object of
// docs/redesign/design/reference/Main.dc.html, the tile copy of Main (desktop) and MobStory (mobile), and the
// «المحرّر يكتب» step texts (Main `stepsText`, MobGenerating). Values in braces come from real data.
import type { CarouselOptions, NewsStoryFormat, NewsSummaryFormat } from "@newsplus/shared";
import { countPhrase, type CountForms } from "@/utils/arabic";

/** Main `F`: the footer name + hint, the AI button label. */
export type FormatCopy = { name: string; hint: string; action: string };

const F: Record<NewsSummaryFormat, FormatCopy> = {
  social: { name: "منشور سوشيال", hint: "٤٠–٧٠ كلمة + وسوم", action: "اكتب المنشور" },
  video: { name: "سكريبت فيديو", hint: "هوك + نص + لقطات", action: "اكتب السكريبت" },
  carousel: { name: "كاروسيل بصور AI", hint: "{slides} + كابشن", action: "اكتب وارسم الشرائح" },
  desk: { name: "خبر مكتبي", hint: "٩٠–١٤٠ كلمة", action: "اكتب الخبر" },
  bulletin: { name: "نشرة", hint: "فقرة واحدة للشريط", action: "اكتب النشرة" },
  facts: { name: "ملف حقائق", hint: "أرقام وأسماء للإسناد", action: "اكتب الحقائق" },
  context: { name: "سياق الخبر", hint: "لماذا يهم الآن", action: "اكتب السياق" },
  briefing: { name: "موجز الساعة", hint: "أهم ٥ عناوين في الغرفة", action: "اكتب الموجز" },
};

export const SLIDES: CountForms = { one: "شريحة واحدة", two: "شريحتين", few: "{n} شرائح", many: "{n} شريحة" };
export const SOURCES: CountForms = { one: "مصدر واحد", two: "مصدرين", few: "{n} مصادر", many: "{n} مصدر" };
export const RULES: CountForms = { one: "قاعدة واحدة", two: "قاعدتين", few: "{n} قواعد", many: "{n} قاعدة" };
export const SECONDS: CountForms = { one: "ثانية", two: "ثانيتين", few: "{n} ثوانٍ", many: "{n} ثانية" };

/** Format copy; the carousel hint names the slide count it will be written with («٤ شرائح + كابشن»). */
export function formatCopy(format: NewsSummaryFormat, slides: number): FormatCopy {
  const copy = F[format];
  return { ...copy, hint: copy.hint.replace("{slides}", countPhrase(slides, SLIDES)) };
}

/** The social tiles (3 columns, `tile`) and the web tiles (`tile tile--row`), in the boards' order. */
export const SOCIAL_FORMATS = ["social", "video", "carousel"] as const satisfies readonly NewsStoryFormat[];
export const WEB_FORMATS = ["desk", "bulletin", "facts", "context"] as const satisfies readonly NewsStoryFormat[];

export const STORY_FORMAT_IDS: readonly NewsStoryFormat[] = [...SOCIAL_FORMATS, ...WEB_FORMATS];

export function isStoryFormat(value: unknown): value is NewsStoryFormat {
  return typeof value === "string" && (STORY_FORMAT_IDS as readonly string[]).includes(value);
}

/** Tile copy: Main (desktop) and MobStory (mobile) name the formats alike but hint them differently. */
export const TILE_COPY: Record<NewsStoryFormat, { name: string; hint: string; mobHint: string }> = {
  social: { name: "منشور سوشيال", hint: "٤٠–٧٠ كلمة · وسوم · خطافان بديلان", mobHint: "٤٠–٧٠ كلمة + وسوم" },
  video: { name: "سكريبت فيديو", hint: "هوك ٣ ثوانٍ · نص · لقطات", mobHint: "هوك ٣ ثوانٍ + لقطات" },
  carousel: { name: "كاروسيل بصور AI", hint: "٣–٦ شرائح · الصور تُرسم تلقائياً", mobHint: "الصور تُرسم تلقائياً" },
  desk: { name: "خبر مكتبي", hint: "٩٠–١٤٠ كلمة", mobHint: "٩٠–١٤٠ كلمة" },
  bulletin: { name: "نشرة", hint: "فقرة للشريط", mobHint: "فقرة للشريط" },
  facts: { name: "حقائق", hint: "للإسناد", mobHint: "للإسناد" },
  context: { name: "سياق", hint: "لماذا يهم الآن", mobHint: "لماذا يهم" },
};

/** MobStory `m-cta` hint: the carousel is named «كاروسيل» there («كاروسيل · ٤ شرائح + كابشن · من ٣ مصادر»). */
const MOB_HINT_NAME: Partial<Record<NewsSummaryFormat, string>> = { carousel: "كاروسيل" };

/** Main: «{hint} · من {sources} · بأسلوب فريقك». */
export function footerHint(copy: FormatCopy, sourceCount: number): string {
  return `${copy.hint} · من ${countPhrase(sourceCount, SOURCES)} · بأسلوب فريقك`;
}

/** MobStory: «{format} · {hint} · من {sources}». */
export function mobileCtaHint(format: NewsSummaryFormat, copy: FormatCopy, sourceCount: number): string {
  return `${MOB_HINT_NAME[format] ?? copy.name} · ${copy.hint} · من ${countPhrase(sourceCount, SOURCES)}`;
}

/** MobStory-carousel CTA: «اكتب وارسم ٤ شرائح». */
export function carouselSheetAction(slides: number): string {
  return `اكتب وارسم ${countPhrase(slides, SLIDES)}`;
}

/** Main `stepsText`: the three steps of «المحرّر يكتب الآن». */
export function deskSteps(format: NewsSummaryFormat, sourceCount: number, slides: number): [string, string, string] {
  const sources = countPhrase(sourceCount, SOURCES);
  if (format === "carousel") return [`قراءة ${sources}`, `تخطيط ${countPhrase(slides, SLIDES)} وكتابة العناوين`, "تجهيز رسم الصور"];
  if (format === "briefing") return ["جمع أهم ٥ عناوين", "ترتيبها حسب الأهمية", "صياغة الموجز"];
  return [`قراءة ${sources}`, `كتابة ${F[format].name}`, "تطبيق أسلوب الفريق والإسناد"];
}

/**
 * MobGenerating steps. The board draws «منشور سوشيال» only: «قرأ ٣ مصادر» · «يكتب الخطاف والنص» ·
 * «يطبّق ٤ قواعد من ذاكرة الفريق». Other formats (and a team memory with no approved rule) keep Main's steps.
 */
export function mobileSteps(
  format: NewsSummaryFormat,
  sourceCount: number,
  slides: number,
  rules: number,
): [string, string, string] {
  const desk = deskSteps(format, sourceCount, slides);
  if (format !== "social") return desk;
  return [
    `قرأ ${countPhrase(sourceCount, SOURCES)}`,
    "يكتب الخطاف والنص",
    rules > 0 ? `يطبّق ${countPhrase(rules, RULES)} من ذاكرة الفريق` : desk[2],
  ];
}

/** Desktop carousel: no settings before generating (S05 §1) — the last-used options, these at first. */
export const DEFAULT_CAROUSEL_OPTIONS: CarouselOptions = { slides: 4, style: "cinematic", density: "banner", mark: true };

/** MobStory-carousel settings. */
export const CAROUSEL_SLIDE_COUNTS = [3, 4, 5, 6] as const;
export const CAROUSEL_DENSITIES = [
  { value: "headline", label: "عنوان" },
  { value: "banner", label: "عنوان وشريط" },
  { value: "line", label: "سطر توضيحي" },
] as const satisfies ReadonlyArray<{ value: CarouselOptions["density"]; label: string }>;

/** UI copy of the S05 boards (Main, Main-generating, MobStory, MobStory-carousel, MobGenerating). */
export const STUDIO_COPY = {
  whatToPublish: "ماذا ننشر؟",
  forSocial: "· للسوشيال",
  forWeb: "للموقع والنشرات",
  memoryChip: (rules: number) => `ذاكرة الفريق: ${countPhrase(rules, RULES)} تُطبَّق تلقائياً`,
  archive: "الأرشيف",
  kbd: "Ctrl ↵",
  writingNow: "المحرّر يكتب الآن",
  cancel: "إلغاء",
  // MobStory
  backToList: "رجوع إلى العناوين",
  story: "الخبر",
  openSource: "فتح المصدر",
  inYourStyle: "بأسلوب فريقك",
  socialFormats: "صيغ السوشيال",
  // MobStory-carousel
  carouselTitle: "إعدادات الكاروسيل",
  close: "إغلاق",
  slideCount: "عدد الشرائح",
  imageStyle: "أسلوب الصور",
  styleStory: "قصة",
  styleStoryArt: "عنوان على الصورة",
  styleCard: "بطاقة",
  styleCardArt: "عنوان في إطار",
  density: "كثافة النص",
  mark: "علامة Newsplus",
  markHint: "اللوجو أعلى كل شريحة",
  // MobGenerating
  back: "رجوع",
  writing: "يكتب…",
  about: (seconds: number) => `حوالي ${countPhrase(seconds, SECONDS)}`,
  keepBrowsing: "تقدر تكمّل تصفّح، وهنبلغك أول ما المسودة تجهز",
  browseHeadlines: "تصفّح العناوين",
  // Background completion (S05 §4)
  draftReady: (format: string) => `المسودة جاهزة: ${format}`,
  open: "افتح",
  // Generation failed / quota (States `errors[]`, S10 owns the full system-state pass)
  failedTitle: "المحرّر ما قدرش يكمّل",
  failedText: "نموذج الذكاء الاصطناعي ما ردّش. اختيارك محفوظ.",
  retry: "أعد المحاولة",
  quotaTitle: "رصيد OpenAI خلص",
  quotaText: "التوليد متوقف لحد ما يتشحن الرصيد من صفحة الفوترة.",
  quotaCta: "اشحن الرصيد",
} as const;

/** Main: «العربية ومصدر آخر» / «العربية و٢ مصادر أخرى». */
const OTHER_SOURCES_DESK: CountForms = {
  one: "ومصدر آخر",
  two: "و{n} مصادر أخرى",
  few: "و{n} مصادر أخرى",
  many: "و{n} مصدر آخر",
};
/** MobStory: «العربية و٢ مصادر». */
const OTHER_SOURCES_MOB: CountForms = { one: "ومصدر آخر", two: "و{n} مصادر", few: "و{n} مصادر", many: "و{n} مصدر" };

export function sourceLine(names: readonly string[], mobile: boolean): string {
  const [lead = "", ...others] = names;
  if (others.length === 0) return lead;
  return `${lead} ${countPhrase(others.length, mobile ? OTHER_SOURCES_MOB : OTHER_SOURCES_DESK)}`;
}
