// Exercise the Arabic UI helpers: digits, count grammar and relative time.
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });
const source = { one: "مصدر واحد", two: "مصدرين", few: "{n} مصادر", many: "{n} مصدر" };
// Local-time dates keep the expectations independent of the machine time zone.
const now = new Date(2026, 10, 4, 10, 0, 0);
const ago = (ms) => new Date(now.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const at = (...parts) => new Date(...parts).toISOString();

try {
  const { toArabicDigits, countPhrase, relativeTimeAr } = await vite.ssrLoadModule("/src/utils/arabic.ts");

  await test("toArabicDigits maps every Western digit and keeps separators", () => {
    assert.equal(toArabicDigits(0), "٠");
    assert.equal(toArabicDigits(1234567890), "١٢٣٤٥٦٧٨٩٠");
    assert.equal(toArabicDigits("1,248"), "١,٢٤٨");
    assert.equal(toArabicDigits("1٬248"), "١٬٢٤٨");
    assert.equal(toArabicDigits("$18.42"), "$١٨.٤٢");
    assert.equal(toArabicDigits("8:10"), "٨:١٠");
    assert.equal(toArabicDigits("40–70"), "٤٠–٧٠");
    assert.equal(toArabicDigits(-3.5), "-٣.٥");
    assert.equal(toArabicDigits("12%"), "١٢%");
  });

  await test("toArabicDigits leaves text and existing Arabic-Indic digits untouched", () => {
    assert.equal(toArabicDigits("GPT-4o"), "GPT-٤o");
    assert.equal(toArabicDigits("قبل ٣ دقائق"), "قبل ٣ دقائق");
    assert.equal(toArabicDigits(""), "");
  });

  await test("countPhrase follows the sprint examples", () => {
    assert.equal(countPhrase(1, source), "مصدر واحد");
    assert.equal(countPhrase(2, source), "مصدرين");
    assert.equal(countPhrase(3, source), "٣ مصادر");
    assert.equal(countPhrase(11, source), "١١ مصدر");
  });

  await test("countPhrase grammar boundaries", () => {
    assert.equal(countPhrase(0, source), "٠ مصدر");
    assert.equal(countPhrase(1, source), "مصدر واحد");
    assert.equal(countPhrase(2, source), "مصدرين");
    assert.equal(countPhrase(3, source), "٣ مصادر");
    assert.equal(countPhrase(10, source), "١٠ مصادر");
    assert.equal(countPhrase(11, source), "١١ مصدر");
    assert.equal(countPhrase(100, source), "١٠٠ مصدر");
    assert.equal(countPhrase(1248, source), "١٢٤٨ مصدر");
  });

  await test("countPhrase never renders Western digits or a bare count with the wrong form", () => {
    for (let n = 0; n <= 120; n++) {
      const phrase = countPhrase(n, source);
      assert.doesNotMatch(phrase, /[0-9]/);
      assert.doesNotMatch(phrase, /\{n\}/);
    }
    assert.notEqual(countPhrase(8, { one: "عنوان واحد", two: "عنوانين", few: "{n} عناوين", many: "{n} عنوان" }), "٨ عنوان");
    assert.equal(countPhrase(8, { one: "عنوان واحد", two: "عنوانين", few: "{n} عناوين", many: "{n} عنوان" }), "٨ عناوين");
  });

  await test("relativeTimeAr renders the sprint phrases", () => {
    assert.equal(relativeTimeAr(ago(0), now), "الآن");
    assert.equal(relativeTimeAr(ago(1 * MIN), now), "قبل دقيقة");
    assert.equal(relativeTimeAr(ago(3 * MIN), now), "قبل ٣ دقائق");
    assert.equal(relativeTimeAr(ago(11 * MIN), now), "قبل ١١ دقيقة");
    assert.equal(relativeTimeAr(ago(1 * HOUR), now), "قبل ساعة");
    assert.equal(relativeTimeAr(ago(2 * HOUR), now), "قبل ساعتين");
    assert.equal(relativeTimeAr(ago(3 * HOUR), now), "قبل ٣ ساعات");
    assert.equal(relativeTimeAr(at(2026, 10, 3, 20, 10), now), "أمس ٨:١٠ م");
  });

  await test("relativeTimeAr cutoffs: seconds, minutes and hours", () => {
    assert.equal(relativeTimeAr(ago(59_999), now), "الآن");
    assert.equal(relativeTimeAr(ago(-5 * MIN), now), "الآن");
    assert.equal(relativeTimeAr(ago(119_999), now), "قبل دقيقة");
    assert.equal(relativeTimeAr(ago(2 * MIN), now), "قبل دقيقتين");
    assert.equal(relativeTimeAr(ago(10 * MIN), now), "قبل ١٠ دقائق");
    assert.equal(relativeTimeAr(ago(59 * MIN + 59_999), now), "قبل ٥٩ دقيقة");
    assert.equal(relativeTimeAr(ago(10 * HOUR), now), "قبل ١٠ ساعات");
    const lateEvening = new Date(2026, 10, 4, 23, 30);
    assert.equal(relativeTimeAr(at(2026, 10, 4, 0, 5), lateEvening), "قبل ٢٣ ساعة");
  });

  await test("relativeTimeAr switches to «أمس» on the previous calendar day only", () => {
    assert.equal(relativeTimeAr(at(2026, 10, 3, 23, 59), now), "أمس ١١:٥٩ م");
    assert.equal(relativeTimeAr(at(2026, 10, 3, 0, 0), now), "أمس ١٢:٠٠ ص");
    assert.equal(relativeTimeAr(at(2026, 10, 3, 12, 0), now), "أمس ١٢:٠٠ م");
    assert.equal(relativeTimeAr(at(2026, 10, 3, 7, 5), now), "أمس ٧:٠٥ ص");
    const justAfterMidnight = new Date(2026, 10, 4, 0, 30);
    assert.equal(relativeTimeAr(at(2026, 10, 3, 23, 50), justAfterMidnight), "قبل ٤٠ دقيقة");
    assert.equal(relativeTimeAr(at(2026, 10, 3, 22, 45), justAfterMidnight), "أمس ١٠:٤٥ م");
    const newYear = new Date(2027, 0, 1, 9, 0);
    assert.equal(relativeTimeAr(at(2026, 11, 31, 20, 10), newYear), "أمس ٨:١٠ م");
  });

  await test("relativeTimeAr shows the date for anything older than yesterday", () => {
    assert.equal(relativeTimeAr(at(2026, 10, 1, 9, 0), now), "١ نوفمبر");
    assert.equal(relativeTimeAr(at(2026, 9, 20, 9, 0), now), "٢٠ أكتوبر");
    assert.equal(relativeTimeAr(at(2025, 9, 20, 9, 0), now), "٢٠ أكتوبر ٢٠٢٥");
  });

  await test("relativeTimeAr defaults to the current time and ignores invalid input", () => {
    assert.equal(relativeTimeAr(new Date().toISOString()), "الآن");
    assert.equal(relativeTimeAr("not a date", now), "");
  });
} finally {
  await vite.close();
}
