// UI copy of the S14 diff boards (NewDiff, MobNewDiff, DeskDraft's «قارن»), verbatim. Values in braces are real.
import { clockAr, toArabicDigits } from "@/utils/arabic";
import { versionLabel } from "../studio/draft/copy";

export const DIFF_COPY = {
  /** DeskDraft toolbar entry and NewDiff's bar label. */
  compare: "قارن",
  /** MobDraft's version sheet and MobNewDiff's m-bar title. */
  compareVersions: "قارن النسخ",
  backToDraft: "المسودة",
  inline: "في سطر واحد",
  sideBySide: "جنب بعض",
  removed: (n: number) => `${toArabicDigits(n)} حذف`,
  added: (n: number) => `${toArabicDigits(n)} إضافة`,
  between: (a: number, aAt: string, b: number, bAt: string) =>
    `بين ${versionLabel(a)} (${clockAr(new Date(aAt))}) و ${versionLabel(b)} (${clockAr(new Date(bAt))})`,
  /** «جنب بعض» column heads: the same «ن١ (٢:٥٨ م)» as the summary line. */
  versionAt: (n: number, at: string) => `${versionLabel(n)} (${clockAr(new Date(at))})`,
  unchanged: "بدون تغيير",
  requested: "إيه اللي اتطلب",
  requestedMob: "التعديلات اللي اتطلبت",
  keep: (n: number) => `اعتمد ${versionLabel(n)}`,
  restore: (n: number) => `رجّع ${versionLabel(n)}`,
  restoreNote: "الرجوع بيعمل نسخة جديدة، ومفيش حاجة بتتمسح",
} as const;
