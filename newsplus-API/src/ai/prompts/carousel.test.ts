import assert from "node:assert/strict";
import { test } from "node:test";
import { carouselPlanAssignment, mergeCarouselSlides } from "./carousel.js";

const slide = {
  headline: "العثور على الجثة رقم 10 يرعب جنوب أفريقيا",
  banner: "ريا وسكينة",
  attribution: "الشرطة بدأت تحقيقاتها بعد العثور على جثث نساء.",
  scene: "",
};

test("plan assignment asks for the three text layers and the cultural punch", () => {
  const prompt = carouselPlanAssignment({ language: "ar", slides: 4, style: "cinematic" });

  assert.match(prompt, /exactly 4/);
  assert.match(prompt, /cyan punch/);
  assert.match(prompt, /ريا وسكينة/);
  assert.match(prompt, /headline, banner, and attribution/);
  assert.doesNotMatch(prompt, /photographable subject/);
  assert.doesNotMatch(prompt, /styleLock/);
});

test("card style names the red punch", () => {
  const prompt = carouselPlanAssignment({ language: "ar", slides: 3, style: "frame" });
  assert.match(prompt, /red punch/);
  assert.match(prompt, /exactly 3/);
});

test("merge keeps a stored image when the words stay and drops it when they change", () => {
  const previous = [
    {
      index: 0,
      role: "hook" as const,
      ...slide,
      scene: "old photo note",
      status: "ready" as const,
      assetId: "version-0",
    },
  ];

  const kept = mergeCarouselSlides(previous, [{ role: "hook", ...slide }]);
  assert.equal(kept[0]?.status, "ready");
  assert.equal(kept[0]?.assetId, "version-0");

  const changed = mergeCarouselSlides(previous, [{ role: "hook", ...slide, headline: "عنوان جديد للشريحة الأولى" }]);
  assert.equal(changed[0]?.status, "ready");
  assert.equal(changed[0]?.assetId, undefined);
  assert.equal(changed[0]?.scene, "");
});
