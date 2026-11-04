// Arabic UI helpers — digits, count grammar and relative time (docs/redesign/GLOBAL-RULES.md §4).

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

const MINUTE_FORMS = { one: "دقيقة", two: "دقيقتين", few: "{n} دقائق", many: "{n} دقيقة" };
const HOUR_FORMS = { one: "ساعة", two: "ساعتين", few: "{n} ساعات", many: "{n} ساعة" };

export type CountForms = { one: string; two: string; few: string; many: string };

/** 0-9 → ٠-٩. Every other character (separators, signs, letters) is kept as-is. */
export function toArabicDigits(v: number | string): string {
  return String(v).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/**
 * Arabic count grammar: 1 → `one`, 2 → `two`, 3–10 → `few`, anything else (11+, and 0) → `many`.
 * `{n}` in a form is replaced with the count in Arabic-Indic digits.
 */
export function countPhrase(n: number, f: CountForms): string {
  const form = n === 1 ? f.one : n === 2 ? f.two : n >= 3 && n <= 10 ? f.few : f.many;
  return form.replace(/\{n\}/g, toArabicDigits(n));
}

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** «٨:١٠ م» — 12-hour local clock, ص before noon, م from noon. */
export function clockAr(d: Date): string {
  const h24 = d.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${toArabicDigits(h12)}:${toArabicDigits(mm)} ${h24 < 12 ? "ص" : "م"}`;
}

/**
 * Relative time in Arabic UI copy, using the viewer's local clock.
 * < 1 min (or in the future) → «الآن» · < 60 min → «قبل دقيقة» / «قبل ٣ دقائق» / «قبل ١١ دقيقة» ·
 * same calendar day → «قبل ساعة» / «قبل ساعتين» / «قبل ٣ ساعات» · previous calendar day → «أمس ٨:١٠ م» ·
 * older → «١ نوفمبر» (year appended when it differs: «٢٠ أكتوبر ٢٠٢٥»). Invalid input → "".
 */
export function relativeTimeAr(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";

  const diff = now.getTime() - then.getTime();
  if (diff < MINUTE_MS) return "الآن";
  if (diff < HOUR_MS) return `قبل ${countPhrase(Math.floor(diff / MINUTE_MS), MINUTE_FORMS)}`;
  if (sameLocalDay(then, now)) return `قبل ${countPhrase(Math.floor(diff / HOUR_MS), HOUR_FORMS)}`;

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameLocalDay(then, yesterday)) return `أمس ${clockAr(then)}`;

  const date = `${toArabicDigits(then.getDate())} ${MONTHS_AR[then.getMonth()]}`;
  return then.getFullYear() === now.getFullYear() ? date : `${date} ${toArabicDigits(then.getFullYear())}`;
}

/**
 * The compact form of the mobile wire rows (MobWire): minutes shorten to «قبل ٣ د» / «قبل ٤٨ د»;
 * everything else is `relativeTimeAr` («الآن», «قبل ساعة», «أمس ٨:١٠ م», …).
 */
export function relativeTimeArShort(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const diff = now.getTime() - then.getTime();
  if (diff >= MINUTE_MS && diff < HOUR_MS) return `قبل ${toArabicDigits(Math.floor(diff / MINUTE_MS))} د`;
  return relativeTimeAr(iso, now);
}
