import type { TranslateLanguage } from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

/** Source limits the translate screen enforced before the redesign (pasted text / article URL). */
export const TEXT_MAX = 20_000;
export const URL_MAX = 2_000;

/** Above this share of Arabic-script letters the source is Arabic (→ English); otherwise → Arabic. */
export const ARABIC_RATIO = 0.3;

export type SourceKind = "text" | "url";

export const LANGUAGE_NAME: Record<TranslateLanguage, string> = {
  ar: "العربية",
  en: "الإنجليزية",
};

const LETTER = /\p{L}/gu;
const ARABIC_LETTER = /(?=\p{L})\p{Script=Arabic}/gu;

/** The source language by script, or null while there are no letters to judge. */
export function detectLanguage(text: string): TranslateLanguage | null {
  const letters = text.match(LETTER)?.length ?? 0;
  if (letters === 0) return null;
  const arabic = text.match(ARABIC_LETTER)?.length ?? 0;
  return arabic / letters > ARABIC_RATIO ? "ar" : "en";
}

export function otherLanguage(language: TranslateLanguage): TranslateLanguage {
  return language === "ar" ? "en" : "ar";
}

/** Typeset output in the target language: its `lang`, `dir` and font (DeskTranslate `outFont`). */
export function outputProps(language: TranslateLanguage) {
  return language === "en"
    ? { lang: "en", dir: "ltr" as const, fontFamily: "'IBM Plex Sans', sans-serif" }
    : { lang: "ar", dir: "rtl" as const, fontFamily: "var(--f-ui)" };
}

const CHAR_FORMS: CountForms = { one: "حرف واحد", two: "حرفين", few: "{n} أحرف", many: "{n} حرف" };

/** «٢٢٨ حرف», «١٬٩٢٠ حرف». */
export function charsPhrase(count: number): string {
  if (count > 999) return `${toArabicDigits(String(count).replace(/\B(?=(\d{3})+(?!\d))/g, "٬"))} حرف`;
  return countPhrase(count, CHAR_FORMS);
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The start of the extracted article for the «النص المستخرج» preview. */
export function excerpt(text: string, max = 220): string {
  const first = paragraphs(text)[0] ?? "";
  return first.length > max ? `${first.slice(0, max).trimEnd()}…` : first;
}
