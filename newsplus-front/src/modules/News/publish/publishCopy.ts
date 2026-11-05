// S12 «جاهز للنشر»: UI copy of the NewPublish, MobNewPreview and MobNewCheck boards (and Main's «فحص ونشر»),
// verbatim. Values in braces come from the draft and the `/check` response.
import type { EditorialPublishPlatform } from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

/** NewPublish `P[k].name` (X · إنستجرام · فيسبوك · تيليجرام · تيك توك). */
export const PLATFORM_NAME: Record<EditorialPublishPlatform, string> = {
  x: "X",
  instagram: "إنستجرام",
  facebook: "فيسبوك",
  telegram: "تيليجرام",
  tiktok: "تيك توك",
};

const NOTES: CountForms = { one: "ملاحظة واحدة", two: "ملاحظتين", few: "{n} ملاحظات", many: "{n} ملاحظة" };

/** «لإنستجرام» (MobNewPreview) for an Arabic name, «لـX» (S12 «نسخ لـ{platform}») for a Latin one. */
function to(name: string): string {
  return /[؀-ۿ]/.test(name) ? `ل${name}` : `لـ${name}`;
}

export const PUBLISH_COPY = {
  // Main draft toolbar
  entry: "فحص ونشر",
  // NewPublish top bar
  back: "المسودة",
  hint: "انسخ للمنصة اللي هتنشر عليها، بالشكل المناسب ليها",
  // Preview
  previewLabel: "معاينة المنصة",
  platformLabel: "المنصة",
  brand: "Newsplus",
  copyFor: (name: string) => `نسخ لـ ${name}`,
  // Aside / sheet
  checkTitle: "فحص قبل النشر",
  checkLead: "المحرّر راجع المسودة على المصادر وقواعد الفريق",
  fixAll: "صلّح الملاحظات تلقائياً",
  /** `badge--warn`: «ملاحظتين · ٤ تمام». */
  summaryWarn: (notes: number, ok: number) => `${countPhrase(notes, NOTES)} · ${toArabicDigits(ok)} تمام`,
  /** `badge--ok`: «٦ من ٦ تمام». */
  summaryOk: (total: number) => `${toArabicDigits(total)} من ${toArabicDigits(total)} تمام`,
  allOk: (version: number) => `المسودة جاهزة للنشر. النسخة ${toArabicDigits(version)} محفوظة بالتعديلات.`,
  // MobNewPreview
  mobTitle: "معاينة النشر",
  mobBack: "رجوع",
  draft: "المسودة",
  preview: "المعاينة",
  postNow: "منشور · الآن",
  more: "المزيد",
  mobCopyFor: (name: string) => `نسخ ${to(name)}`,
  // MobNewCheck
  copyAnyway: "انسخ زي ما هو",
} as const;

/** NewPublish `P[k].limitTitle` / `limitNote` («{n} من ٢٨٠ حرف» — the count is the platform copy's). */
export const LIMIT_COPY: Record<EditorialPublishPlatform, { title: (count: string) => string; note: string }> = {
  x: { title: (count) => `${count} من ٢٨٠ حرف`, note: "قريب من الحد · الوسوم محسوبة" },
  instagram: { title: () => "أول سطرين ظاهرين قبل «المزيد»", note: "الخطاف لازم يكفي لوحده" },
  facebook: { title: () => "طول مناسب", note: "الرابط يتحط في أول تعليق" },
  telegram: { title: (count) => `${count} من ٤٬٠٩٦ حرف`, note: "الوسوم اختيارية هنا" },
  tiktok: { title: () => "كابشن قصير", note: "الهوك بيتقال في الفيديو" },
};

/** X's note says «قريب من الحد» only in that band (85–100%); outside it, the rest of the note. */
export const X_NOTE_OUTSIDE_BAND = "الوسوم محسوبة";

/** MobNewPreview's ring row for Instagram. */
export const MOB_INSTAGRAM_LIMIT = { title: `طول مناسب ${to(PLATFORM_NAME.instagram)}`, note: "أول سطرين بس اللي بيظهروا" } as const;
