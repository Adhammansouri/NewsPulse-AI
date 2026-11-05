// S11: keyboard shortcuts and the command palette — reading a key press (Latin and Arabic layouts), the typing
// guard, the keymap with its sequences and their 1s timeout, the palette's matching / <mark> highlight / groups,
// and the NewCmdK + NewShortcuts markup.
// Run from the workspace root: node newsplus-front/scripts/check-hotkeys.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });

const key = (k, fields = {}) => ({ key: k, code: "", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...fields });
const combo = (k, fields = {}) => ({ key: k, mod: false, shift: false, alt: false, ...fields });
const el = (tagName, fields = {}) => ({
  tagName,
  isContentEditable: false,
  getAttribute: (name) => fields.attrs?.[name] ?? null,
  hasAttribute: (name) => fields.attrs?.[name] !== undefined,
  ...fields,
});

const MIN = 60_000;
const NOW = new Date(2026, 10, 5, 15, 0, 0);
const ago = (minutes) => new Date(NOW.getTime() - minutes * MIN).toISOString();
const source = (id, name) => ({ id, name, url: `https://${id}.example` });
const item = (id, title, fields = {}) => ({ id, title, summary: "", publishedAt: ago(3), breaking: false, topic: "economy", sources: [source("alarabiya", "العربية")], ...fields });
const draft = (id, title, format, minutes) => ({ id, title, format, language: "ar", createdAt: ago(minutes), updatedAt: ago(minutes), createdBy: "u1", versionCount: 1, status: "draft", assigneeId: "u1", publishedPlatforms: [], commentCount: 0 });

// QA data (never shipped): a breaking story carried by three sources, an English one, two more, and three drafts.
const STORY = item("n1", "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة", {
  breaking: true,
  sources: [source("alarabiya", "العربية"), source("sky", "سكاي نيوز عربية"), source("asharq", "الشرق")],
});
const FEED = [
  STORY,
  item("n2", "اجتماع طارئ لوزراء الخارجية العرب", { publishedAt: ago(11) }),
  item("n3", "Global oil prices climb after OPEC+ signals extended cuts", { publishedAt: ago(26), sources: [source("reuters", "Reuters")] }),
  item("n4", "منتخب مصر يعلن قائمة المعسكر المقبل", { publishedAt: ago(48) }),
];
const DRAFTS = [
  draft("c1", "التثبيت الثالث: لماذا يتمسك المركزي بالحذر؟", "desk", 120),
  draft("c2", "الفائدة بين التضخم والنمو", "social", 200),
  draft("c3", "قائمة المنتخب", "video", 300),
];
const PAGES = ["home", "news", "workflow", "archive", "usage"];

try {
  const keys = await vite.ssrLoadModule("/src/hooks/hotkeys.ts");
  const model = await vite.ssrLoadModule("/src/components/shell/commandModel.ts");
  const { PaletteView } = await vite.ssrLoadModule("/src/components/shell/CommandPalette.tsx");
  const { ShortcutsSheetBody } = await vite.ssrLoadModule("/src/components/shell/ShortcutsSheet.tsx");
  const { features } = await vite.ssrLoadModule("/src/config/features.ts");
  const { readKey, resolveHotkey, isTypingTarget, allowedWhileTyping, isActivationTarget, repeats, SEQUENCE_TIMEOUT_MS } = keys;

  await test("S11 turns the shortcuts on", () => {
    assert.equal(features.shortcuts, true);
  });

  await test("readKey: letters, digits and symbols on a Latin layout", () => {
    assert.deepEqual(readKey(key("j")), combo("J"));
    assert.deepEqual(readKey(key("J", { shiftKey: true })), combo("J", { shift: true }));
    assert.deepEqual(readKey(key("k", { ctrlKey: true })), combo("K", { mod: true }));
    assert.deepEqual(readKey(key("k", { metaKey: true })), combo("K", { mod: true }), "⌘ counts as Ctrl");
    assert.deepEqual(readKey(key("Enter", { ctrlKey: true })), combo("Enter", { mod: true }));
    assert.deepEqual(readKey(key("?", { shiftKey: true })), combo("?", { shift: true }));
    assert.deepEqual(readKey(key("/")), combo("/"));
    assert.deepEqual(readKey(key("3")), combo("3"));
    assert.deepEqual(readKey(key("Escape")), combo("Escape"));
    assert.deepEqual(readKey(key("Esc")), combo("Escape"));
    assert.equal(readKey(key(" ", { code: "Space" })), null);
    assert.equal(readKey(key("Shift", { code: "ShiftLeft", shiftKey: true })), null);
    assert.equal(readKey(key("Tab", { code: "Tab" })), null);
  });

  await test("readKey: the Arabic layout falls back to the physical key", () => {
    assert.deepEqual(readKey(key("ت", { code: "KeyJ" })), combo("J"));
    assert.deepEqual(readKey(key("ن", { code: "KeyK", ctrlKey: true })), combo("K", { mod: true }));
    assert.deepEqual(readKey(key("ي", { code: "KeyD", shiftKey: true })), combo("D", { shift: true }));
    assert.deepEqual(readKey(key("ب", { code: "KeyF" })), combo("F"));
    assert.deepEqual(readKey(key("١", { code: "Digit1" })), combo("1"));
    assert.deepEqual(readKey(key("ظ", { code: "Slash" })), combo("/"));
    assert.deepEqual(readKey(key("؟", { code: "Slash", shiftKey: true })), combo("?", { shift: true }));
  });

  await test("typing guard: fields being typed in stand the shortcuts down", () => {
    assert.equal(isTypingTarget(el("INPUT", { type: "text" })), true);
    assert.equal(isTypingTarget(el("INPUT", { type: "search" })), true, "the wire search");
    assert.equal(isTypingTarget(el("TEXTAREA")), true, "the revise dock");
    assert.equal(isTypingTarget(el("SELECT")), true);
    assert.equal(isTypingTarget(el("DIV", { isContentEditable: true })), true);
    assert.equal(isTypingTarget(el("INPUT", { type: "checkbox" })), false);
    assert.equal(isTypingTarget(el("BUTTON")), false);
    assert.equal(isTypingTarget(el("BODY")), false);
    assert.equal(isTypingTarget(null), false);
  });

  await test("typing guard: only Esc, Ctrl/⌘ K and Ctrl/⌘ ↵ get through", () => {
    assert.equal(allowedWhileTyping(combo("Escape")), true);
    assert.equal(allowedWhileTyping(combo("K", { mod: true })), true);
    assert.equal(allowedWhileTyping(combo("Enter", { mod: true })), true);
    for (const plain of ["J", "K", "/", "?", "B", "C", "1", "F", "G", "Enter"]) assert.equal(allowedWhileTyping(combo(plain)), false, plain);
    assert.equal(allowedWhileTyping(combo("D", { shift: true })), false);
    assert.equal(allowedWhileTyping(combo("K", { mod: true, alt: true })), false, "AltGr");
  });

  await test("↵ on a button, link or option is the element's own", () => {
    assert.equal(isActivationTarget(el("BUTTON")), true, "a wire row is a button");
    assert.equal(isActivationTarget(el("A", { attrs: { href: "/news" } })), true);
    assert.equal(isActivationTarget(el("A")), false, "an anchor without href");
    assert.equal(isActivationTarget(el("DIV", { attrs: { role: "option" } })), true);
    assert.equal(isActivationTarget(el("DIV", { attrs: { role: "tab" } })), true);
    assert.equal(isActivationTarget(el("DIV")), false);
    assert.equal(isActivationTarget(el("BODY")), false);
  });

  await test("keymap: single keys (S11 §1)", () => {
    const one = (c) => resolveHotkey(c, null, 0).action;
    assert.deepEqual(one(combo("K", { mod: true })), { type: "palette" });
    assert.deepEqual(one(combo("/")), { type: "search" });
    assert.deepEqual(one(combo("?", { shift: true })), { type: "shortcuts" });
    assert.deepEqual(one(combo("D", { shift: true })), { type: "theme" });
    assert.deepEqual(one(combo("J")), { type: "next" });
    assert.deepEqual(one(combo("K")), { type: "prev" });
    assert.deepEqual(one(combo("Enter")), { type: "open" });
    assert.deepEqual(one(combo("B")), { type: "briefing" });
    assert.deepEqual(one(combo("C")), { type: "copyAll" });
    assert.deepEqual(one(combo("P")), { type: "publish" });
    for (let n = 1; n <= 5; n += 1) assert.deepEqual(one(combo(String(n))), { type: "time", index: n });
    assert.equal(one(combo("6")), null, "five time filters");
    assert.equal(one(combo("D")), null, "dark mode needs Shift");
    assert.equal(one(combo("J", { shift: true })), null);
    assert.equal(one(combo("C", { mod: true })), null, "Ctrl+C stays the browser's copy");
    assert.equal(one(combo("Enter", { mod: true })), null, "Ctrl ↵ belongs to the studio / generate screens");
    assert.equal(one(combo("J", { alt: true })), null);
    assert.deepEqual(resolveHotkey(combo("F"), null, 0), { action: null, state: { prefix: "F", at: 0 }, consumed: true });
    assert.deepEqual(resolveHotkey(combo("G"), null, 0), { action: null, state: { prefix: "G", at: 0 }, consumed: true });
  });

  await test("keymap: F 1–7 and G H/N/W/A/U within the sequence timeout", () => {
    const F = { prefix: "F", at: 1000 };
    const G = { prefix: "G", at: 1000 };
    for (let n = 1; n <= 7; n += 1) assert.deepEqual(resolveHotkey(combo(String(n)), F, 1500).action, { type: "format", index: n });
    assert.deepEqual(resolveHotkey(combo("1"), F, 1000 + SEQUENCE_TIMEOUT_MS).action, { type: "format", index: 1 }, "exactly 1s still counts");
    const pages = { H: "home", N: "news", W: "workflow", A: "archive", U: "usage" };
    for (const [letter, page] of Object.entries(pages)) assert.deepEqual(resolveHotkey(combo(letter), G, 1200).action, { type: "go", page });
    assert.equal(resolveHotkey(combo("1"), F, 1500).state, null, "the sequence ends with its second key");
  });

  await test("keymap: a sequence times out after 1s, and a wrong second key starts over", () => {
    const F = { prefix: "F", at: 0 };
    const late = resolveHotkey(combo("1"), F, SEQUENCE_TIMEOUT_MS + 1);
    assert.deepEqual(late.action, { type: "time", index: 1 }, "after the timeout, 1 is the time filter");
    assert.equal(late.state, null);
    assert.equal(resolveHotkey(combo("8"), F, 100).action, null, "F 8: no eighth format, no time filter 8");
    assert.deepEqual(resolveHotkey(combo("J"), F, 100).action, { type: "next" }, "F J: J on its own");
    assert.deepEqual(resolveHotkey(combo("H"), { prefix: "G", at: 0 }, 2000).action, null, "a late H is nothing");
    assert.deepEqual(resolveHotkey(combo("G"), { prefix: "G", at: 0 }, 300).state, { prefix: "G", at: 300 }, "G G restarts");
    assert.deepEqual(resolveHotkey(combo("Escape"), { prefix: "G", at: 0 }, 300), { action: null, state: null, consumed: true });
    assert.deepEqual(resolveHotkey(combo("H", { shift: true }), { prefix: "G", at: 0 }, 300).action, null);
  });

  await test("holding J / K repeats; nothing else does", () => {
    assert.equal(repeats({ type: "next" }), true);
    assert.equal(repeats({ type: "prev" }), true);
    assert.equal(repeats({ type: "copyAll" }), false);
    assert.equal(repeats({ type: "palette" }), false);
  });

  await test("matching folds Arabic spelling, harakat, digits and case", () => {
    const { matchesQuery, queryTokens, foldText } = model;
    assert.deepEqual(queryTokens("  البنك   الفائدة "), ["البنك", "الفائده"]);
    assert.equal(foldText("Oil ٣").folded, "oil 3");
    assert.equal(matchesQuery(STORY.title, queryTokens("الفائده")), true, "ة / ه");
    assert.equal(matchesQuery("أسعار", queryTokens("اسعار")), true, "أ / ا");
    assert.equal(matchesQuery("الفَائِدَة", queryTokens("الفائدة")), true, "harakat");
    assert.equal(matchesQuery("المـــركزي", queryTokens("المركزي")), true, "tatweel");
    assert.equal(matchesQuery("التضخم ٣٫١٪", queryTokens("3")), true, "Arabic-Indic digits");
    assert.equal(matchesQuery(FEED[2].title, queryTokens("OIL opec")), true, "Latin case, words in any order");
    assert.equal(matchesQuery(STORY.title, queryTokens("الفائدة النفط")), false, "every word must match");
    assert.equal(matchesQuery("anything", []), true);
  });

  await test("highlight: <mark> runs on the original text", () => {
    const { highlight } = model;
    assert.deepEqual(highlight("اكتب عن الفائدة اليوم", "الفائدة"), [
      { text: "اكتب عن ", mark: false },
      { text: "الفائدة", mark: true },
      { text: " اليوم", mark: false },
    ]);
    assert.deepEqual(highlight("الفَائِدَة", "الفائده"), [{ text: "الفَائِدَة", mark: true }], "the marked run keeps its harakat");
    assert.deepEqual(highlight("Global Oil prices", "oil"), [
      { text: "Global ", mark: false },
      { text: "Oil", mark: true },
      { text: " prices", mark: false },
    ]);
    assert.deepEqual(
      highlight("البنك المركزي والبنك الأهلي", "البنك").filter((s) => s.mark).map((s) => s.text),
      ["البنك", "البنك"],
      "every occurrence",
    );
    assert.deepEqual(highlight("أسعار الفائدة", "الفائدة اسعار"), [
      { text: "أسعار", mark: true },
      { text: " ", mark: false },
      { text: "الفائدة", mark: true },
    ]);
    assert.deepEqual(highlight("مفيش", "xyz"), [{ text: "مفيش", mark: false }]);
    assert.deepEqual(highlight("نص", ""), [{ text: "نص", mark: false }]);
  });

  await test("metas: the story, a headline, a draft", () => {
    assert.equal(model.storyMeta(STORY), "آخر عاجل · العربية ومصدرين");
    assert.equal(model.storyMeta(item("x", "t", { sources: [source("a", "العربية"), source("b", "ب"), source("c", "ج"), source("d", "د")] })), "العربية و٣ مصادر");
    assert.equal(model.storyMeta(item("x", "t")), "العربية");
    assert.equal(model.headlineMeta(STORY, NOW), "العربية +٢ · قبل ٣ دقائق · عاجل");
    assert.equal(model.headlineMeta(FEED[1], NOW), "العربية · قبل ١١ دقيقة");
    assert.equal(model.draftMeta(DRAFTS[0], NOW), "مسودة · خبر مكتبي · قبل ساعتين");
  });

  await test("headlines: stories first, a draft, at most three", () => {
    const { pickHeadlines } = model;
    assert.deepEqual(pickHeadlines([1, 2, 3, 4], ["a", "b"]), { feed: [1, 2], drafts: ["a"] });
    assert.deepEqual(pickHeadlines([1, 2, 3, 4], []), { feed: [1, 2, 3], drafts: [] });
    assert.deepEqual(pickHeadlines([1], ["a", "b", "c"]), { feed: [1], drafts: ["a", "b"] });
    assert.deepEqual(pickHeadlines([], ["a", "b", "c", "d"]), { feed: [], drafts: ["a", "b", "c"] });
    assert.deepEqual(pickHeadlines([], []), { feed: [], drafts: [] });
  });

  const base = { feed: FEED, drafts: DRAFTS, pages: PAGES, now: NOW, aiBlocked: false };
  const titleText = (option) => option.title.map((s) => s.text).join("");
  const marked = (option) => option.title.filter((s) => s.mark).map((s) => s.text);

  await test("palette, empty query: the three groups with recent items", () => {
    const palette = model.buildPalette({ ...base, query: "", story: STORY });
    assert.deepEqual(palette.groups.map((g) => g.label), ["أفعال بالمحرّر", "عناوين", "انتقال"]);
    const [social, video, briefing] = palette.groups[0].options;
    assert.equal(titleText(social), `اكتب منشور سوشيال عن ${STORY.title}`);
    assert.deepEqual(marked(social), []);
    assert.deepEqual(social.run, { type: "write", format: "social", story: STORY, text: "" });
    assert.deepEqual(social.keys, ["↵"]);
    assert.equal(social.meta, "آخر عاجل · العربية ومصدرين");
    assert.equal(titleText(video), `سكريبت فيديو عن ${STORY.title}`);
    assert.deepEqual(video.keys, ["Ctrl", "↵"]);
    assert.equal(video.meta, "هوك + نص + لقطات");
    assert.equal(titleText(briefing), "موجز الساعة");
    assert.equal(briefing.meta, "أهم ٥ عناوين الآن");
    assert.deepEqual(briefing.keys, ["B"]);
    assert.ok([social, video, briefing].every((o) => o.ai && !o.disabled));
    assert.deepEqual(palette.groups[1].options.map((o) => o.key), ["item-n1", "item-n2", "draft-c1"]);
    assert.ok(palette.groups[1].options.every((o) => o.keys === null && !o.ai && o.icon === "news"));
    assert.deepEqual(palette.groups[2].options.map((o) => titleText(o)), ["الرئيسية", "الأخبار", "سير العمل", "الأرشيف", "استهلاك الذكاء الاصطناعي"]);
    assert.deepEqual(palette.groups[2].options.map((o) => o.keys), [["G", "H"], ["G", "N"], ["G", "W"], ["G", "A"], ["G", "U"]]);
    assert.equal(palette.noResults, null);
    assert.equal(palette.options.length, 3 + 3 + 5);
  });

  await test("palette, empty query off the newsroom: no story, so no write actions", () => {
    const palette = model.buildPalette({ ...base, query: "", story: null, pages: ["home", "news", "archive"] });
    assert.deepEqual(palette.groups[0].options.map((o) => o.key), ["briefing"]);
    assert.deepEqual(palette.groups[2].options.map((o) => o.run.page), ["home", "news", "archive"]);
  });

  await test("palette, a query that matches the open story (NewCmdK)", () => {
    const palette = model.buildPalette({ ...base, query: " الفائدة ", story: STORY });
    // As the board: «انتقال» stays under «الفائدة» although no page name matches it.
    assert.deepEqual(palette.groups.map((g) => g.key), ["actions", "headlines", "pages"]);
    const [social, video] = palette.groups[0].options;
    assert.deepEqual(social.title, [{ text: "اكتب منشور سوشيال عن ", mark: false }, { text: "الفائدة", mark: true }]);
    assert.deepEqual(social.run, { type: "write", format: "social", story: STORY, text: "الفائدة" });
    assert.equal(social.meta, "آخر عاجل · العربية ومصدرين");
    assert.deepEqual(video.title, [{ text: "سكريبت فيديو عن ", mark: false }, { text: "الفائدة", mark: true }]);
    const briefing = palette.groups[0].options[2];
    assert.deepEqual(briefing.title, [{ text: "موجز الساعة", mark: false }], "the board keeps «موجز الساعة» under a query it does not match");
    const headlines = palette.groups[1].options;
    assert.deepEqual(headlines.map((o) => o.key), ["item-n1", "draft-c2"]);
    assert.deepEqual(marked(headlines[0]), ["الفائدة"]);
    assert.equal(headlines[0].meta, "العربية +٢ · قبل ٣ دقائق · عاجل");
    assert.equal(headlines[1].meta, "مسودة · منشور سوشيال · قبل ٣ ساعات");
    assert.equal(palette.noResults, null);
  });

  await test("palette, a query the open story does not match: written from the text", () => {
    const palette = model.buildPalette({ ...base, query: "oil", story: STORY });
    const [social, video] = palette.groups[0].options;
    assert.deepEqual(social.run, { type: "write", format: "social", story: null, text: "oil" });
    assert.equal(social.meta, null);
    assert.deepEqual(video.run, { type: "write", format: "video", story: null, text: "oil" });
    const [english] = palette.groups[1].options;
    assert.equal(english.dir, "ltr", "an English headline reads LTR");
    assert.deepEqual(marked(english), ["oil"]);
  });

  await test("palette, pages match by name; «موجز» finds the briefing", () => {
    assert.deepEqual(model.buildPalette({ ...base, query: "سير", story: null }).groups.find((g) => g.key === "pages").options.map((o) => o.run.page), ["workflow"]);
    const briefing = model.buildPalette({ ...base, query: "موجز", story: null }).groups[0].options.find((o) => o.key === "briefing");
    assert.deepEqual(marked(briefing), ["موجز"]);
  });

  await test("palette, no matches: «مفيش نتائج لـ «…»» after the actions, «انتقال» still listed", () => {
    const palette = model.buildPalette({ ...base, query: "زلزال", story: STORY });
    assert.deepEqual(palette.groups.map((g) => g.key), ["actions", "pages"]);
    assert.deepEqual(palette.groups[0].options.map((o) => o.key), ["write-social", "write-video", "briefing"]);
    // NewCmdK keeps the pages under a query none of them matches.
    assert.deepEqual(palette.groups[1].options.map((o) => o.run.page), PAGES);
    assert.equal(palette.noResults, "مفيش نتائج لـ «زلزال»");
  });

  await test("palette, AI cooldown (S10): the AI actions are disabled", () => {
    const palette = model.buildPalette({ ...base, query: "", story: STORY, aiBlocked: true });
    assert.ok(palette.groups[0].options.every((o) => o.disabled));
    assert.ok(palette.groups[1].options.every((o) => !o.disabled));
  });

  await test("palette ↑ / ↓ wrap", () => {
    assert.equal(model.moveActive(0, 5, 1), 1);
    assert.equal(model.moveActive(4, 5, 1), 0);
    assert.equal(model.moveActive(0, 5, -1), 4);
    assert.equal(model.moveActive(0, 0, 1), 0);
  });

  await test("NewCmdK markup: listbox, options, <mark>, LTR combos, footer", () => {
    const palette = model.buildPalette({ ...base, query: "الفائدة", story: STORY });
    const html = renderToStaticMarkup(
      h(PaletteView, { query: "الفائدة", model: palette, active: 0, baseId: "p", onQuery() {}, onActive() {}, onPick() {} }),
    );
    assert.match(html, /^<div class="palette" role="dialog" aria-modal="true" aria-label="لوحة الأوامر"/);
    assert.match(html, /<div class="palette__input"><svg class="ic ic--lg"[^>]*style="color:var\(--cyan\)"/);
    assert.match(html, /role="combobox" aria-label="لوحة الأوامر" aria-expanded="true" aria-controls="p-list"/);
    assert.match(html, /aria-activedescendant="p-o0"/);
    assert.match(html, /<span class="key">Esc<\/span><\/div><div id="p-list" class="palette__group" role="listbox" aria-label="نتائج"/);
    assert.match(html, /<div id="p-actions" class="palette__label">أفعال بالمحرّر<\/div>/);
    assert.match(html, /<div id="p-o0" class="palette__item" role="option" aria-selected="true">/);
    assert.match(html, /<div id="p-o1" class="palette__item" role="option" aria-selected="false">/);
    assert.match(html, /<span class="ic-wrap ic-wrap--ai" style="width:30px;height:30px;border-radius:9px"><svg class="ic ic--sm"/);
    assert.match(html, /<span class="ellipsis" style="font-weight:600">اكتب منشور سوشيال عن <mark>الفائدة<\/mark><\/span><span class="t-meta">آخر عاجل · العربية ومصدرين<\/span>/);
    assert.match(html, /<span class="row" dir="ltr" style="gap:4px"><span class="key">↵<\/span><\/span>/);
    assert.match(html, /<span class="row" dir="ltr" style="gap:4px"><span class="key">Ctrl<\/span><span class="key">↵<\/span><\/span>/);
    assert.match(html, /<span class="ic-wrap" style="width:30px;height:30px;border-radius:9px">/, "a headline: plain ic-wrap");
    assert.match(html, /<span class="row" style="gap:4px"><\/span>/, "a headline: no keys");
    assert.match(html, /<div class="palette__foot"><span class="row" style="gap:6px"><span class="key">↑<\/span><span class="key">↓<\/span>للتنقل<\/span><span class="row" style="gap:6px"><span class="key">↵<\/span>للتنفيذ<\/span><span class="grow"><\/span><span class="row" style="gap:6px"><span class="key">\?<\/span>كل الاختصارات<\/span><\/div>/);
    assert.doesNotMatch(html, /مفيش نتائج/);

    const none = model.buildPalette({ ...base, query: "زلزال", story: null });
    const emptyHtml = renderToStaticMarkup(h(PaletteView, { query: "زلزال", model: none, active: 0, baseId: "p", onQuery() {}, onActive() {}, onPick() {} }));
    assert.match(emptyHtml, /<p class="t-meta" aria-live="polite" style="padding:8px 10px">مفيش نتائج لـ «زلزال»<\/p>/);
  });

  await test("NewShortcuts markup: header, the four groups, LTR combos, the tip", () => {
    const html = renderToStaticMarkup(h(ShortcutsSheetBody, { titleId: "ks-t" }));
    assert.match(html, /<span class="ic-wrap"><svg class="ic"[^>]*><path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8"><\/path><\/svg><\/span><h2 id="ks-t" class="t-title">اختصارات الكيبورد<\/h2>/);
    assert.match(html, /<span class="row t-meta" style="gap:6px">اقفل <span class="key">Esc<\/span><\/span>/);
    assert.match(html, /<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px 32px">/);
    const titles = [...html.matchAll(/<h3 class="t-label" style="margin-bottom:6px">([^<]+)<\/h3>/g)].map((m) => m[1]);
    assert.deepEqual(titles, ["في كل مكان", "العناوين", "الكتابة", "التنقل"]);
    assert.match(html, /<div class="row" style="justify-content:space-between;padding:9px 0;border-bottom:1px solid var\(--line\)"><span class="t-small" style="color:var\(--ink\)">لوحة الأوامر<\/span><span class="row" dir="ltr" style="gap:4px"><span class="key">Ctrl<\/span><span class="key">K<\/span><\/span><\/div>/);
    assert.match(html, /صفّي حسب الوقت<\/span><span class="row" dir="ltr" style="gap:4px"><span class="key">1<\/span><span class="key">–<\/span><span class="key">5<\/span>/);
    assert.match(html, /اختار الصيغة<\/span><span class="row" dir="ltr" style="gap:4px"><span class="key">F<\/span><span class="key">1–7<\/span>/);
    assert.match(html, /فحص قبل النشر<\/span><span class="row" dir="ltr" style="gap:4px"><span class="key">P<\/span>/);
    assert.match(html, /الأرشيف<\/span><span class="row" dir="ltr" style="gap:4px"><span class="key">G<\/span><span class="key">A<\/span>/);
    assert.equal((html.match(/border-bottom:1px solid var\(--line\)/g) ?? []).length, 16);
    assert.match(html, /<p class="t-meta">الصحفي اللي بيستخدم الكيبورد يقدر يروح من عاجل لمنشور جاهز من غير ما يلمس الماوس: J ← F 1 ← Ctrl ↵ ← C<\/p>$/);
  });

  await test("every sequence the sheet lists resolves to its action", () => {
    for (const group of model.SHORTCUT_GROUPS) {
      for (const row of group.rows) {
        if (row.keys[0] !== "G") continue;
        const first = resolveHotkey(combo("G"), null, 0);
        const second = resolveHotkey(combo(row.keys[1]), first.state, 500);
        assert.equal(second.action?.type, "go", row.label);
        assert.equal(model.GO_PAGES[second.action.page].label, row.label);
      }
    }
  });
} finally {
  await vite.close();
}
