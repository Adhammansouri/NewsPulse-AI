// S14: «تطور القصة» (timeline view model, copy, conflict constraints) and «قارن النسخ» (the word diff per format,
// the counts, «جنب بعض», the requests between two versions, and the NewDiff markup).
// Run from the workspace root: node newsplus-front/scripts/check-timeline-diff.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear() };
};
globalThis.localStorage = memoryStorage();
globalThis.window ??= globalThis;

const MIN = 60_000;
// Local-time dates keep the clock strings independent of the machine time zone.
const at = (hours, minutes) => new Date(2026, 10, 5, hours, minutes);
const iso = (date) => date.toISOString();

const draft = (format, fields = {}) => ({
  title: "",
  dek: "",
  summary: "",
  bullets: [],
  sources: [],
  language: "ar",
  format,
  ...fields,
});
const version = (number, copy, note = "", createdAt = at(14, 50 + number)) => ({
  id: `v${number}`,
  conversationId: "c1",
  number,
  copy,
  note,
  createdAt: iso(createdAt),
  createdBy: "u1",
});
const message = (id, role, content, versionId) => ({ id, conversationId: "c1", role, content, versionId, createdAt: iso(at(15, 0)), createdBy: "u1" });

// NewDiff's own two versions of the video script (the board's ن١ → ن٣).
const HOOK_A = "المركزي قال «لا» للمرة الثالثة.. والسبب رقم واحد";
const HOOK_B = "المركزي قال «لا» للمرة الثالثة.. فما الذي ينتظره بالضبط؟";
const SCRIPT_A = "اللجنة أبقت الفائدة كما هي، لأن التضخم رغم تراجعه ما زال فوق المستهدف. الرسالة للأسواق واضحة جداً: لا خفض قبل أن تؤكد البيانات الاتجاه.";
const SCRIPT_B = "اللجنة أبقت الفائدة كما هي، لأن التضخم رغم تراجعه ما زال فوق المستهدف. الرسالة للأسواق: لا خفض قبل أن تؤكد البيانات الاتجاه. فماذا يعني ذلك لقروضك ومدخراتك؟";
const SHOTS = ["لقطة المبنى", "رسم الفائدة"];
const videoDraft = (hook, script) => draft("video", { title: "عنوان", dek: "غلاف", summary: `${hook}\n<<<\n${script}`, bullets: SHOTS });

try {
  const model = await vite.ssrLoadModule("/src/modules/News/diff/diffModel.ts");
  const { DIFF_COPY } = await vite.ssrLoadModule("/src/modules/News/diff/copy.ts");
  const { DiffText } = await vite.ssrLoadModule("/src/modules/News/diff/DiffText.tsx");
  const { DeskDiff } = await vite.ssrLoadModule("/src/modules/News/diff/DeskDiff.tsx");
  const { MobDiff } = await vite.ssrLoadModule("/src/modules/News/diff/MobDiff.tsx");
  const { isCompareOpen, withCompareParam } = await vite.ssrLoadModule("/src/modules/News/diff/useCompare.ts");
  const timeline = await vite.ssrLoadModule("/src/modules/News/timeline/timelineModel.ts");
  const copy = await vite.ssrLoadModule("/src/modules/News/timeline/copy.ts");
  const constraints = await vite.ssrLoadModule("/src/modules/News/timeline/constraints.ts");

  /* ---------- Part B · the diff ---------- */

  await test("video: NewDiff's word diff — «٢ حذف», «٢ إضافة», the shots «بدون تغيير»", () => {
    const fields = model.diffVersions(videoDraft(HOOK_A, SCRIPT_A), videoDraft(HOOK_B, SCRIPT_B));
    assert.deepEqual(
      fields.map((field) => [field.key, field.changed]),
      [["videoHook", true], ["script", true], ["shots", false]],
    );
    assert.deepEqual(fields.map((field) => field.label), ["الهوك", "النص", "اللقطات"]);
    const retitled = model.diffVersions(videoDraft(HOOK_A, SCRIPT_A), { ...videoDraft(HOOK_A, SCRIPT_A), title: "عنوان آخر" });
    assert.deepEqual(retitled.map((field) => [field.key, field.changed]), [["title", true], ["videoHook", false], ["script", false], ["shots", false]], "the title shows once it changed");
    const totals = model.diffTotals(fields);
    assert.deepEqual(totals, { removed: 2, added: 2 });
    assert.equal(DIFF_COPY.removed(totals.removed), "٢ حذف");
    assert.equal(DIFF_COPY.added(totals.added), "٢ إضافة");

    const html = (key) => renderToStaticMarkup(h(DiffText, { parts: fields.find((field) => field.key === key).parts }));
    assert.equal(html("videoHook"), 'المركزي قال «لا» للمرة الثالثة.. <del class="d">والسبب رقم واحد</del> <ins class="d">فما الذي ينتظره بالضبط؟</ins>');
    assert.equal(
      html("script"),
      'اللجنة أبقت الفائدة كما هي، لأن التضخم رغم تراجعه ما زال فوق المستهدف. الرسالة للأسواق<del class="d"> واضحة جداً</del>: لا خفض قبل أن تؤكد البيانات الاتجاه.<ins class="d"> فماذا يعني ذلك لقروضك ومدخراتك؟</ins>',
    );
  });

  await test("social: hook, body, hashtags and alternatives, each diffed on its own", () => {
    const before = draft("social", { title: "رفع الفائدة اليوم", summary: "قرار جديد.", bullets: ["#اقتصاد #فائدة", "عنوان بديل"] });
    const after = draft("social", { title: "تثبيت الفائدة اليوم", summary: "قرار جديد.", bullets: ["#اقتصاد #بنوك", "عنوان بديل"] });
    const fields = model.diffVersions(before, after);
    assert.deepEqual(fields.map((field) => field.key), ["hook", "body", "tags", "alts"]);
    assert.deepEqual(fields.map((field) => field.changed), [true, false, true, false]);
    assert.equal(fields[0].kind, "head");
    assert.deepEqual(model.diffTotals(fields), { removed: 2, added: 2 });
  });

  await test("doc formats follow the draft's blocks; a field empty in both versions is left out", () => {
    const facts = model.diffVersions(draft("facts", { title: "أ", bullets: ["١", "٢"] }), draft("facts", { title: "أ", bullets: ["١", "٣"] }));
    assert.deepEqual(facts.map((field) => field.key), ["title", "points"]);
    assert.deepEqual(facts.map((field) => field.changed), [false, true]);
    const desk = model.diffVersions(draft("desk", { title: "أ", dek: "ب", summary: "نص" }), draft("desk", { title: "أ", dek: "ب", summary: "نص آخر" }));
    assert.deepEqual(desk.map((field) => field.key), ["title", "dek", "body"]);
    assert.deepEqual(model.diffTotals(desk), { removed: 0, added: 1 });
    const bulletin = model.diffVersions(draft("bulletin", { title: "أ", summary: "نص" }), draft("bulletin", { title: "أ", summary: "نص" }));
    assert.ok(bulletin.every((field) => !field.changed));
    assert.deepEqual(model.diffTotals(bulletin), { removed: 0, added: 0 });
  });

  await test("carousel and briefing: slides, caption and tags; the briefing's stories", () => {
    const slides = (lines) => ({ slides: lines.map((headline, index) => ({ index, headline, banner: "" })) });
    const carousel = model.diffVersions(
      draft("carousel", { summary: "تعليق", bullets: ["اقتصاد"], carousel: slides(["أ", "ب"]) }),
      draft("carousel", { summary: "تعليق", bullets: ["اقتصاد"], carousel: slides(["أ", "ج"]) }),
    );
    assert.deepEqual(carousel.map((field) => [field.key, field.changed]), [["slide-0", false], ["slide-1", true], ["caption", false], ["tags", false]]);
    const briefing = model.diffVersions(draft("briefing", { title: "موجز", bullets: ["١. خبر", "٢. آخر"] }), draft("briefing", { title: "موجز", bullets: ["خبر", "ثالث"] }));
    assert.deepEqual(briefing.map((field) => field.key), ["title", "items"]);
    assert.equal(briefing[1].changed, true);
  });

  await test("«جنب بعض»: the older side keeps only deletions, the newer only additions", () => {
    const parts = model.wordDiff("أ ب ج", "أ د ج");
    const { before, after } = model.sideBySide(parts);
    assert.ok(before.every((part) => part.kind !== "ins") && before.some((part) => part.kind === "del"));
    assert.ok(after.every((part) => part.kind !== "del") && after.some((part) => part.kind === "ins"));
    assert.deepEqual(model.wordDiff("نفس", "نفس"), [{ kind: "same", text: "نفس" }]);
  });

  const versions = [
    version(1, videoDraft(HOOK_A, SCRIPT_A), "", at(14, 58)),
    version(2, videoDraft(HOOK_A, SCRIPT_B), "خليه أقصر", at(15, 2)),
    version(3, videoDraft(HOOK_B, SCRIPT_B), "الهوك سؤال", at(15, 6)),
    version(4, videoDraft(HOOK_A, SCRIPT_A), "أُعيدت النسخة 1", at(15, 9)),
  ];
  const detail = {
    versions,
    currentVersionId: "v4",
    messages: [
      message("m1", "user", "اختصر النص", "v2"),
      message("m2", "assistant", "خليه أقصر", "v2"),
      message("m3", "user", "خلي الهوك سؤال", "v3"),
      message("m4", "assistant", "الهوك سؤال", "v3"),
      message("m5", "assistant", "أُعيدت النسخة 1", "v4"),
    ],
  };

  await test("«إيه اللي اتطلب»: the requests and answers after the older version, up to the newer", () => {
    assert.deepEqual(
      model.requestsBetween(detail, 1, 3).map((turn) => [turn.kind, turn.text]),
      [
        ["me", "اختصر النص"],
        ["ai", "خليه أقصر ن٢"],
        ["me", "خلي الهوك سؤال"],
        ["ai", "الهوك سؤال ن٣"],
      ],
    );
    assert.deepEqual(model.requestsBetween(detail, 3, 2).map((turn) => turn.key), ["m3", "m4"], "either order");
    assert.deepEqual(model.requestsBetween(detail, 3, 4).map((turn) => [turn.kind, turn.text]), [["sys", "رجعت للنسخة ١"]]);
    assert.deepEqual(model.requestsBetween(undefined, 1, 2), []);
  });

  await test("the default pair is the first version against the newest; a side never offers the other's", () => {
    const pair = model.defaultPair(versions);
    assert.deepEqual([pair.from.number, pair.to.number], [1, 4]);
    assert.deepEqual(model.sideOptions(versions, versions[2]).map((item) => item.number), [1, 2, 4]);
    assert.equal(model.defaultPair(versions.slice(0, 1)), null);
    assert.equal(DIFF_COPY.between(1, iso(at(14, 58)), 3, iso(at(15, 6))), "بين ن١ (٢:٥٨ م) و ن٣ (٣:٠٦ م)");
  });

  await test("`?compare=` belongs to one conversation", () => {
    assert.equal(withCompareParam("?item=n1", "c1"), "?item=n1&compare=c1");
    assert.equal(withCompareParam("?item=n1&compare=c1", null), "?item=n1");
    assert.equal(isCompareOpen(new URLSearchParams("compare=c1"), "c1"), true);
    assert.equal(isCompareOpen(new URLSearchParams("compare=c1"), "c2"), false);
    assert.equal(isCompareOpen(new URLSearchParams(""), "c1"), false);
  });

  const fakeDesk = (current) => ({
    conversationId: "c1",
    detail: { ...detail, versions: versions.slice(0, 3), currentVersionId: current },
    busy: false,
    draftError: null,
    restore() {},
  });

  await test("DeskDiff: NewDiff's bar, counts, «بين …», the fields and «إيه اللي اتطلب»", () => {
    const html = renderToStaticMarkup(h(DeskDiff, { desk: fakeDesk("v3"), data: versions[2].copy, onClose() {} }));
    assert.ok(html.includes("المسودة") && html.includes("قارن") && html.includes("في سطر واحد") && html.includes("جنب بعض"));
    assert.match(html, /badge--breaking[^>]*>٢ حذف<\/span><span[^>]*badge--ok[^>]*>٢ إضافة<\/span><span class="t-meta">بين ن١ \(٢:٥٨ م\) و ن٣ \(٣:٠٦ م\)<\/span>/);
    assert.match(html, /<span class="t-meta" style="font-weight:600">اللقطات<\/span><p class="t-small">بدون تغيير<\/p>/);
    assert.match(html, /<p style="font-size:18px;line-height:1.9;font-weight:600" dir="rtl">المركزي/);
    assert.ok(html.includes("إيه اللي اتطلب") && html.includes("msg msg--me") && html.includes("اعتمد ن٣") && html.includes("رجّع ن١"));
    assert.ok(html.includes("الرجوع بيعمل نسخة جديدة، ومفيش حاجة بتتمسح"));
  });

  await test("MobDiff: «قارن النسخ», the editor's requests only, «رجّع ن١» / «اعتمد ن٣» in the m-cta", () => {
    const html = renderToStaticMarkup(h(MobDiff, { desk: fakeDesk("v3"), data: versions[2].copy, onClose() {} }));
    assert.ok(html.includes("قارن النسخ") && html.includes("التعديلات اللي اتطلبت"));
    assert.ok(html.includes("msg msg--me") && !html.includes("msg msg--ai"));
    assert.match(html, /رجّع ن١.*اعتمد ن٣/s);
  });

  /* ---------- Part A · the timeline ---------- */

  const lookup = timeline.sourceLookup({ sources: [{ id: "s1", name: "العربية", url: "https://example.com/1" }] }, [
    { id: "s2", name: "سكاي نيوز عربية" },
  ]);
  const data = {
    entries: [
      { sourceId: "s1", at: iso(at(14, 52)), headline: "خبر أول", tag: "first", isNew: false },
      { sourceId: "s2", at: iso(at(14, 58)), headline: "رقم جديد", tag: "number", isNew: false },
      { sourceId: "s3", at: iso(at(15, 1)), headline: "تعليق", tag: "update", isNew: false },
      { sourceId: "s2", at: iso(at(15, 4)), headline: "رد فعل", tag: "reaction", isNew: true },
    ],
    conflicts: [{ field: "نسبة التضخم", values: [{ sourceId: "s1", value: "٢٫٩٪" }, { sourceId: "s2", value: "٣٫١٪" }], safeWording: "نحو ٣٪" }],
    agreed: [{ text: "تثبيت الفائدة", sourceCount: 3 }],
    confirmedBy: 4,
  };

  await test("timeline rows: clock, the first / new dot, desktop badge and mobile meta", () => {
    const view = timeline.timelineView(data, lookup, new Date(at(15, 5)));
    assert.deepEqual(view.rows.map((row) => row.dot), ["is-first", "", "", "is-new"]);
    assert.deepEqual(view.rows.map((row) => row.time), ["٢:٥٢ م", "٢:٥٨ م", "٣:٠١ م", "٣:٠٤ م"]);
    assert.deepEqual(view.rows.map((row) => row.tag), ["أول من نشر", "أضاف رقم", "", "جديد · رد فعل"]);
    assert.deepEqual(view.rows.map((row) => row.metaMob), ["العربية · أول من نشر", "سكاي نيوز عربية · أضاف رقم", "s3", "سكاي نيوز عربية · جديد"]);
    assert.match(view.meta, /^٤ تحديثات خلال ١٢ دقيقة · آخر تحديث /);
    assert.equal(view.metaMob, "٤ تحديثات في ١٢ دقيقة");
    assert.deepEqual(timeline.timelineView({ ...data, entries: [] }, lookup), { count: 0, rows: [], meta: "", metaMob: "" });
  });

  await test("timeline copy: tabs, «مؤكد من …», the chip, the conflict and agreed lines", () => {
    assert.equal(copy.TIMELINE_COPY.tabTimelineCount(4), "تطور القصة · ٤");
    assert.equal(copy.TIMELINE_COPY.confirmedBy(4), "مؤكد من ٤ مصادر");
    assert.equal(copy.TIMELINE_COPY.storyChip(4), "تطور القصة · ٤ تحديثات");
    assert.equal(copy.TIMELINE_COPY.conflictLead("نسبة التضخم", 2), "نسبة التضخم مش متطابقة بين مصدرين:");
    assert.equal(copy.TIMELINE_COPY.agreedRow("تثبيت الفائدة", 3), "تثبيت الفائدة · ٣ مصادر");
    assert.equal(copy.sinceDraft(5 * MIN), "٥ دقايق");
    assert.equal(copy.sinceDraft(2 * 60 * MIN), "ساعتين");
  });

  await test("the draft-update panel: the newest entry after the draft, as an attributed revision", () => {
    assert.equal(timeline.entryAfter(data.entries, iso(at(15, 0)))?.headline, "رد فعل");
    assert.equal(timeline.entryAfter(data.entries, iso(at(15, 10))), null);
    assert.equal(timeline.entryAfter(data.entries, null), null);
    assert.equal(timeline.updateInstruction(data.entries[3], "سكاي نيوز عربية"), "أضف التحديث الجديد من سكاي نيوز عربية منسوباً إليه: «رد فعل»");
  });

  await test("«المصادر»: one row per source link, in reporting order", () => {
    const rows = timeline.sourceRows(
      { sources: [{ id: "s2", name: "ب", url: "https://example.com/2" }, { id: "s1", name: "أ", url: "https://example.com/1" }, { id: "s2", name: "ب", url: "https://example.com/2" }] },
      data.entries,
      lookup,
    );
    assert.deepEqual(rows.map((row) => [row.key, row.time]), [["s1", "٢:٥٢ م"], ["s2", "٢:٥٨ م"]]);
  });

  await test("a conflict choice becomes the story's constraint, sent with the next generation", () => {
    localStorage.clear();
    const conflict = data.conflicts[0];
    const name = (id) => lookup(id).name;
    const both = constraints.constraintText(conflict, { kind: "attribute" }, name);
    assert.equal(both, "اذكر نسبة التضخم: ٢٫٩٪ بحسب العربية و٣٫١٪ بحسب سكاي نيوز عربية");
    const adopt = constraints.constraintText(conflict, { kind: "adopt", sourceId: "s1" }, name);
    assert.equal(adopt, "اعتمد نسبة التضخم: ٢٫٩٪ بحسب العربية، ولا تذكر رقماً آخر لها");
    assert.equal(constraints.constraintText(conflict, { kind: "adopt", sourceId: "nope" }, name), "");

    assert.deepEqual(constraints.constraintsFor("n1"), {});
    constraints.saveConstraint("n1", conflict.field, both);
    constraints.saveConstraint("n1", conflict.field, adopt);
    assert.deepEqual(constraints.constraintsFor("n1"), { constraints: [adopt] }, "one constraint per disputed figure");
    assert.equal(constraints.readChoice("n1", conflict.field), adopt);
    assert.deepEqual(constraints.constraintsFor(null), {});
  });

  await test("constraints stay inside the API's bounds: 6 per story, 300 characters, 40 stories", () => {
    localStorage.clear();
    for (let index = 0; index < 8; index += 1) constraints.saveConstraint("n1", `f${index}`, `قيد ${index}`);
    const kept = constraints.readConstraints("n1");
    assert.equal(kept.length, constraints.MAX_CONSTRAINTS);
    assert.deepEqual(kept, ["قيد 2", "قيد 3", "قيد 4", "قيد 5", "قيد 6", "قيد 7"]);
    constraints.saveConstraint("n2", "f", "ق".repeat(400));
    assert.equal(constraints.readConstraints("n2")[0].length, constraints.MAX_CONSTRAINT_LENGTH);
    for (let index = 0; index < 45; index += 1) constraints.saveConstraint(`s${index}`, "f", "قيد", 1000 + index);
    assert.deepEqual(constraints.readConstraints("s0"), [], "the oldest stories are dropped");
    assert.deepEqual(constraints.readConstraints("s44"), ["قيد"]);
    localStorage.setItem("np.storyConstraints", "{broken");
    assert.deepEqual(constraints.constraintsFor("n1"), {}, "unreadable storage means no constraint");
  });
} finally {
  await vite.close();
}
