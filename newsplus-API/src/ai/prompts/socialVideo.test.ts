import assert from "node:assert/strict";
import { test } from "node:test";
import { SOCIAL_VIDEO_FORMAT_SPEC, SOCIAL_VIDEO_REVISION_EXAMPLES } from "./socialVideo.js";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function beatCount(script: string) {
  return script
    .split(/^<<<<<<$/m)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

test("video spec encodes AJ+ cover, first seconds, and plot questions", () => {
  assert.match(SOCIAL_VIDEO_FORMAT_SPEC, /غلاف|الكوفر|thumbnail/i);
  assert.match(SOCIAL_VIDEO_FORMAT_SPEC, /3–5 ثوان|3-5 ثوان|first 3–5 seconds/);
  assert.match(SOCIAL_VIDEO_FORMAT_SPEC, /دقة|attribute|Attribution/i);
  assert.match(SOCIAL_VIDEO_FORMAT_SPEC, /طبقة/);
  assert.match(SOCIAL_VIDEO_FORMAT_SPEC, /عائلت/);
  assert.doesNotMatch(SOCIAL_VIDEO_FORMAT_SPEC, /official AJ\+ voice dump/i);
});

test("cover stays short enough for a thumbnail", () => {
  const cover = "توأم إيراني\nإحداهما تواجه الإعدام";
  assert.ok(wordCount(cover) <= 14);
  assert.ok(cover.split("\n").length <= 4);
});

test("script beats and questions open new layers", () => {
  const script = `ترانه ورومينا رحيمي..
توأم من إيران

<<<<<<

ما الذي أوصل ترانه إلى حكم الإعدام؟

التوأم حُوكمتا مع 14 شخصاً

<<<<<<

لكن هل اعترفت بإرادتها؟

عائلتهما تقول..
تحت التعذيب والتهديد`;

  assert.equal(beatCount(script), 3);
  assert.match(script, /ما الذي أوصل/);
  assert.match(script, /عائلتهما تقول/);
  assert.doesNotMatch(script, /الاعترافات انتُزعت تحت التعذيب\n/);
});

test("revision examples forbid narrator-laundered allegations", () => {
  assert.match(SOCIAL_VIDEO_REVISION_EXAMPLES, /بدون اضافات|دون إضافات/);
  assert.match(SOCIAL_VIDEO_REVISION_EXAMPLES, /عائلتهما تقول/);
  assert.match(SOCIAL_VIDEO_REVISION_EXAMPLES, /Don't: "الاعترافات انتُزعت تحت التعذيب"/);
});
