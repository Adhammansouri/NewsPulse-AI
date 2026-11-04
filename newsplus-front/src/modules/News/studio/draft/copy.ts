// UI copy of the S06 draft boards (Main-social…context, DeskDraft, DeskCarousel, MobDraft*), verbatim. Values in
// braces come from real data. Quick-revise chips: Main's `qsets` on desktop, MobDraft's `quick` on mobile.
import type { NewsSummaryFormat } from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";
import { HEADLINES } from "../../wire/copy";
import { RULES, SOURCES } from "../formats";

const VERSIONS: CountForms = { one: "نسخة واحدة", two: "نسختان", few: "{n} نسخ", many: "{n} نسخة" };

/** «ن٣» */
export const versionLabel = (n: number) => `ن${toArabicDigits(n)}`;

/** MobDraft `names`: the m-bar badge (desktop uses the Main `F` names, formatCopy). */
export const MOB_FORMAT_NAME: Partial<Record<NewsSummaryFormat, string>> = { carousel: "كاروسيل" };

/** Main constructor `NOUN` (+ `run()`'s nouns for the formats it lacks): «جهّزت {noun} وطبّقت …». */
const OPENING_NOUN: Record<NewsSummaryFormat, string> = {
  social: "المنشور",
  briefing: "الموجز",
  desk: "الخبر المكتبي",
  bulletin: "النشرة",
  facts: "ملف الحقائق",
  context: "السياق",
  video: "السكريبت",
  carousel: "نصوص الشرائح",
};

export const DRAFT_COPY = {
  // Toolbar (Main / DeskDraft) and m-bar (MobDraft)
  story: "الخبر",
  backToStory: "رجوع إلى الخبر",
  versions: "النسخ",
  restoreVersion: (n: number) => `استعادة النسخة ${toArabicDigits(n)}`,
  currentVersion: (n: number) => `النسخة ${toArabicDigits(n)} الحالية`,
  switchFormat: "تحويل الصيغة",
  download: "تنزيل",
  copyAll: "نسخ الكل",
  copied: "تم النسخ",
  copy: "نسخ",
  // Provenance
  provenance: (sources: number, rules: number) => {
    const from = sources > 0 ? ` من ${countPhrase(sources, SOURCES)}` : "";
    const memory = rules > 0 ? ` وطبّق ${countPhrase(rules, RULES)} من ذاكرة الفريق` : "";
    return `كتبه المحرّر${from}${memory} · راجعه قبل النشر`;
  },
  // Blocks
  hook: "الخطاف",
  body: "النص",
  tags: "الوسوم",
  altsDesk: "خطافات بديلة · اضغط لاستبدال",
  altMob: "خطاف بديل · اضغط للاستبدال",
  replaceHook: (alt: string) => `استبدل الخطاف بـ: ${alt}`,
  cover: "الكوفر",
  videoTitle: "عنوان النشر",
  videoHookDesk: "الهوك · ٠–٣ ثوانٍ",
  videoHookMob: "الهوك · ٠–٣ ث",
  shots: "لقطات / CG",
  title: "العنوان",
  bulletinTitle: "النشرة",
  dek: "المقدمة",
  pointsDesk: "أبرز النقاط",
  pointsFacts: "الحقائق",
  pointsFactsMob: "الحقائق · للإسناد",
  pointsContext: "لماذا يهم الآن",
  briefingHead: (count: number) => `موجز الساعة · أهم ${countPhrase(count, HEADLINES)}`,
  briefingHeadMob: (clock: string) => `موجز ${clock}`,
  caption: "الكابشن",
  changedIn: (label: string, n: number) => `${label} · عُدّل في ${versionLabel(n)}`,
  // Copy toasts (Main `flash`): «نُسخ الخطاف», «نُسخ النص», «نُسخت الوسوم», «نُسخ {format} كاملاً»
  copiedHook: "نُسخ الخطاف",
  copiedBody: "نُسخ النص",
  copiedTags: "نُسخت الوسوم",
  copiedVideoTitle: "نُسخ عنوان النشر",
  copiedVideoHook: "نُسخ الهوك",
  copiedTitle: "نُسخ العنوان",
  copiedCaption: "نُسخ الكابشن",
  copiedAll: (format: string) => `نُسخ ${format} كاملاً`,
  copyFailed: "تعذّر النسخ",
  selectText: "حدّد النص",
  // Editor aside / thread / dock
  editor: "المحرّر",
  everyEdit: "كل تعديل نسخة جديدة",
  versionsSaved: (n: number) => `${countPhrase(n, VERSIONS)} محفوظة`,
  opening: (format: NewsSummaryFormat, rules: number) =>
    rules > 0
      ? `جهّزت ${OPENING_NOUN[format]} وطبّقت ${countPhrase(rules, RULES)} من ذاكرة الفريق. اطلب أي تعديل وسأحفظه كنسخة جديدة.`
      : `جهّزت ${OPENING_NOUN[format]}. اطلب أي تعديل وسأحفظه كنسخة جديدة.`,
  versionSaved: (n: number) => `النسخة ${toArabicDigits(n)} محفوظة.`,
  restoredTo: (n: number) => `رجعت للنسخة ${toArabicDigits(n)}`,
  thenBackTo: (n: number) => `ثم عدت للنسخة ${toArabicDigits(n)}`,
  revising: "يعدّل النص…",
  askEdit: "اطلب تعديلاً",
  placeholderDesk: "اطلب تعديلاً… مثلاً: اجعل الخطاف سؤالاً",
  placeholderMob: "اطلب تعديلاً…",
  placeholderBusy: "استنى المحرّر يخلص…",
  send: "إرسال",
  // Memory suggestion (DeskDraft, MobDraft-memory) and its edit field (MobArchive-memory)
  learned: "المحرّر تعلّم قاعدة جديدة",
  saveForTeam: "احفظ للفريق",
  edit: "عدّل",
  dismiss: "تجاهل",
  // Revise error (MobDraft-error)
  reviseFailed: "المحرّر ما قدرش يعدّل",
  reviseFailedText: (instruction: string) => `النموذج ما ردّش. طلبك «${instruction}» محفوظ.`,
  retry: "أعد المحاولة",
} as const;

/** Main `qsets` (desktop) — the default set for social and the web formats. */
const QUICK_DESK: Partial<Record<NewsSummaryFormat, readonly string[]>> = {
  video: ["قوِّ الهوك", "اختصر لـ٣٠ ثانية"],
  carousel: ["قصّر العناوين", "شدّ الشريحة الأولى"],
  briefing: ["اجعله ٣ عناوين", "أضف سطر السياق"],
};
const QUICK_DEFAULT = ["اجعل الخطاف سؤالاً", "اختصر دون إضافات", "انسب الادعاءات لأصحابها"] as const;

/** MobDraft `quick`; the carousel's second chip («أعد رسم الشريحة {n}») is the slide that needs redrawing. */
const QUICK_MOB: Partial<Record<NewsSummaryFormat, readonly string[]>> = {
  video: ["قوِّ الهوك", "اختصر لـ٣٠ ثانية"],
  carousel: ["قصّر العناوين"],
  briefing: ["اجعله ٣ عناوين", "أضف سطر سياق"],
};
const QUICK_DEFAULT_MOB = ["اجعل الخطاف سؤالاً", "اختصر دون إضافات"] as const;

/** MobDraft: «حوّله لفيديو» writes the story again as a video script. */
export const TO_VIDEO = "حوّله لفيديو";
/** MobDraft-carousel: «أعد رسم الشريحة ٤». */
export const redrawSlide = (n: number) => `أعد رسم الشريحة ${toArabicDigits(n)}`;

export function quickRevisions(format: NewsSummaryFormat, mobile: boolean): readonly string[] {
  if (mobile) return QUICK_MOB[format] ?? QUICK_DEFAULT_MOB;
  return QUICK_DESK[format] ?? QUICK_DEFAULT;
}

/** MobDraft's default set ends with «حوّله لفيديو» (social and the web formats). */
export function offersToVideo(format: NewsSummaryFormat, mobile: boolean): boolean {
  return mobile && QUICK_MOB[format] === undefined;
}

export const CAROUSEL_COPY = {
  headlines: "العناوين",
  downloadImages: "تنزيل الصور",
  copyTexts: "نسخ النصوص",
  counter: (n: number, total: number) => `${toArabicDigits(n)} / ${toArabicDigits(total)}`,
  aiImage: "الصورة مرسومة بالذكاء الاصطناعي من وصف المشهد · بدون وجوه حقيقية",
  slides: "الشرائح",
  ready: "جاهزة",
  painting: "تُرسم…",
  queued: "في الانتظار",
  review: "راجعها",
  failed: "فشل الرسم",
  slideN: (n: number) => `شريحة ${toArabicDigits(n)}`,
  tally: (ready: number, painting: number, review: number) =>
    [
      ready > 0 ? `${toArabicDigits(ready)} جاهزة` : "",
      painting > 0 ? `${toArabicDigits(painting)} تُرسم` : "",
      review > 0 ? `${toArabicDigits(review)} تحتاج مراجعة` : "",
    ]
      .filter(Boolean)
      .join(" · "),
  mismatch: (n: number) => `الشريحة ${toArabicDigits(n)} لا تطابق نصها`,
  paintFailed: (n: number) => `تعذّر رسم الشريحة ${toArabicDigits(n)}`,
  redraw: "أعد الرسم",
  // Mobile progress (MobDraft-carousel)
  paintingImages: "يرسم الصور",
  readyOf: (ready: number, total: number) => `${toArabicDigits(ready)} من ${toArabicDigits(total)} جاهزة`,
  // Settings aside (DeskCarousel)
  settings: "إعدادات الكاروسيل",
  settingsTitle: "إعدادات الشرائح",
  style: "الأسلوب",
  styleNotice: "تغيير الأسلوب يعيد رسم الصور. النصوص الحالية تبقى كما هي.",
  update: "حدّث الشرائح",
} as const;
