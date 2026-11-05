// Run from the workspace root: node newsplus-front/scripts/check-newsroom.mjs
// Server-rendered acceptance checks; these do not replace browser/touch QA.
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createServer } from "vite";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({
  root: frontendRoot,
  configFile: resolve(frontendRoot, "vite.config.ts"),
  server: { middlewareMode: true, watch: null },
  appType: "custom",
});

try {
  const { default: NewsPage } = await vite.ssrLoadModule("/src/modules/News/pages/NewsPage.tsx");
  const { DeskDraft } = await vite.ssrLoadModule("/src/modules/News/studio/draft/DeskDraft.tsx");
  const { MobDraft } = await vite.ssrLoadModule("/src/modules/News/studio/draft/MobDraft.tsx");
  const { DeskCarousel } = await vite.ssrLoadModule("/src/modules/News/studio/carousel/DeskCarousel.tsx");
  const { FilterSheet } = await vite.ssrLoadModule("/src/modules/News/wire/FilterSheet.tsx");
  const { applyFilters, readFilters, sourceLanguages, writeFilters } = await vite.ssrLoadModule("/src/modules/News/wire/filters.ts");
  const { emptyText, HEADLINES, NEW_HEADLINES } = await vite.ssrLoadModule("/src/modules/News/wire/copy.ts");
  const pins = await vite.ssrLoadModule("/src/modules/News/wire/briefingPins.ts");
  const { countPhrase, relativeTimeArShort } = await vite.ssrLoadModule("/src/utils/arabic.ts");
  const { ToastProvider } = await vite.ssrLoadModule("/src/ui/Toast.tsx");
  const archive = await vite.ssrLoadModule("/src/modules/News/studio/archive/archiveModel.ts");
  const { DeskArchive } = await vite.ssrLoadModule("/src/modules/News/studio/archive/DeskArchive.tsx");
  const { MobArchive } = await vite.ssrLoadModule("/src/modules/News/studio/archive/MobArchive.tsx");
  const { sourceTone } = await vite.ssrLoadModule("/src/modules/News/newsFormat.ts");
  const formats = await vite.ssrLoadModule("/src/modules/News/studio/formats.ts");
  const runs = await vite.ssrLoadModule("/src/modules/News/studio/draftRuns.ts");
  const { MobStory } = await vite.ssrLoadModule("/src/modules/News/studio/MobStory.tsx");
  const { MobCarouselSheet } = await vite.ssrLoadModule("/src/modules/News/studio/MobCarouselSheet.tsx");
  const { storyModel } = await vite.ssrLoadModule("/src/modules/News/studio/storyModel.ts");
  const sources = [{ id: "ar-desk", name: "المصدر العربي", language: "ar" }, { id: "en-desk", name: "English Desk", language: "en" }];
  const items = [{
    id: "fixture-story",
    title: "هيئة النقل تؤجل القرار لحين انتهاء الدراسة",
    excerpt: "قالت الهيئة إنها لم توافق بعد على الخطة الجديدة.",
    publishedAt: new Date().toISOString(),
    breaking: true,
    topic: "economy",
    sources: [{ id: "ar-desk", name: "المصدر العربي", url: "https://example.com/report" }],
  }];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.setQueryData(["news-sources"], { sources });
  client.setQueryData(["news-feed", "all", ""], { fetchedAt: new Date().toISOString(), items });
  const renderPage = (entry = "/news") =>
    renderToStaticMarkup(h(QueryClientProvider, { client }, h(ToastProvider, null, h(MemoryRouter, { initialEntries: [entry] }, h(NewsPage)))));

  await test("newsroom exposes all eight editorial formats and preserves the source preview", () => {
    const html = renderPage();
    for (const name of ["منشور سوشيال", "سكريبت فيديو", "كاروسيل بصور AI", "خبر مكتبي", "نشرة", "حقائق", "سياق", "موجز الساعة"]) {
      assert.ok(html.includes(name), `Missing format: ${name}`);
    }
    assert.ok(html.includes(items[0].title));
    assert.ok(html.includes(items[0].excerpt));
    assert.ok(html.includes('href="https://example.com/report"'));
    assert.match(html, /badge--breaking[^>]*>عاجل/);
    assert.match(html, /wire-row__title" dir="rtl"/);
  });

  await test("generation stays outside the scrolling article and the wire names the open story", () => {
    const html = renderPage();
    const footer = html.slice(html.indexOf("<footer"));
    assert.ok(html.indexOf("<footer") > html.lastIndexOf("</article>"));
    assert.ok(footer.includes("الأرشيف"));
    assert.ok(footer.includes('اكتب المنشور<span class="kbd">Ctrl ↵</span>'));
    assert.ok(footer.includes("٤٠–٧٠ كلمة + وسوم · من مصدر واحد · بأسلوب فريقك"));
    assert.match(html, /class="tile" type="button" aria-pressed="true"><span class="tile__shape"[^]*?منشور سوشيال/);
    assert.equal(html.match(/class="tile[^"]*" type="button" aria-pressed="true"/g)?.length, 1, "one format tile is pressed");
    assert.doesNotMatch(html, /ذاكرة الفريق/, "the memory chip is hidden with no approved rule");
    assert.match(html, /<section aria-label="العناوين"/);
    assert.match(html, /class="wire-row is-breaking" aria-pressed="true"/);
  });

  await test("format copy, action labels and AI steps follow the interactive Main board", () => {
    const actions = { social: "اكتب المنشور", video: "اكتب السكريبت", carousel: "اكتب وارسم الشرائح", desk: "اكتب الخبر", bulletin: "اكتب النشرة", facts: "اكتب الحقائق", context: "اكتب السياق", briefing: "اكتب الموجز" };
    for (const [format, action] of Object.entries(actions)) assert.equal(formats.formatCopy(format, 4).action, action);
    assert.equal(formats.formatCopy("carousel", 5).hint, "٥ شرائح + كابشن");
    assert.deepEqual(formats.deskSteps("social", 3, 4), ["قراءة ٣ مصادر", "كتابة منشور سوشيال", "تطبيق أسلوب الفريق والإسناد"]);
    assert.deepEqual(formats.deskSteps("carousel", 3, 4), ["قراءة ٣ مصادر", "تخطيط ٤ شرائح وكتابة العناوين", "تجهيز رسم الصور"]);
    assert.deepEqual(formats.deskSteps("briefing", 0, 4), ["جمع أهم ٥ عناوين", "ترتيبها حسب الأهمية", "صياغة الموجز"]);
    assert.deepEqual(formats.mobileSteps("social", 3, 4, 4), ["قرأ ٣ مصادر", "يكتب الخطاف والنص", "يطبّق ٤ قواعد من ذاكرة الفريق"]);
    assert.equal(formats.mobileCtaHint("carousel", formats.formatCopy("carousel", 4), 3), "كاروسيل · ٤ شرائح + كابشن · من ٣ مصادر");
    assert.equal(formats.carouselSheetAction(4), "اكتب وارسم ٤ شرائح");
    assert.equal(formats.sourceLine(["العربية", "BBC", "رويترز"], false), "العربية و٢ مصادر أخرى");
    assert.equal(formats.sourceLine(["العربية", "BBC", "رويترز"], true), "العربية و٢ مصادر");
    assert.equal(formats.STUDIO_COPY.memoryChip(4), "ذاكرة الفريق: ٤ قواعد تُطبَّق تلقائياً");
  });

  await test("draft runs outlive the studio: cancel aborts, an unwatched run toasts «المسودة جاهزة» with «افتح»", async () => {
    const originalFetch = globalThis.fetch;
    const pending = [];
    globalThis.fetch = (_url, init) =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, signal: init.signal });
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    const respond = (index, data) => pending[index].resolve(new Response(JSON.stringify({ status: "success", data })));
    const settle = () => new Promise((done) => setTimeout(done, 20));
    const runClient = new QueryClient();
    const shown = [];
    const opened = [];
    const notify = { toast: { show: (message, options) => shown.push({ message, options }), dismiss() {} }, open: (id) => opened.push(id) };
    const info = { format: "social", itemId: "fixture-story", slides: 4 };
    const body = { itemId: "fixture-story", language: "ar", format: "social" };
    try {
      const cancelled = runs.startDraftRun(runClient, { body, info, notify });
      await settle();
      runs.cancelDraftRun(cancelled);
      await settle();
      assert.equal(pending[0].signal.aborted, true);
      assert.equal(runs.readDraftRun(runClient, cancelled), null);

      const watched = runs.startDraftRun(runClient, { body, info, notify });
      const release = runs.watchDraftRun(watched);
      await settle();
      respond(1, { format: "social", conversationId: "c1" });
      await settle();
      assert.equal(runs.readDraftRun(runClient, watched)?.status, "success");
      release();

      const left = runs.startDraftRun(runClient, { body, info, notify });
      await settle();
      respond(2, { format: "social", conversationId: "c2" });
      await settle();
      assert.equal(shown.length, 1, "only the run nobody watched toasts");
      assert.equal(shown[0].message, "المسودة جاهزة: منشور سوشيال");
      assert.equal(shown[0].options.action.label, "افتح");
      shown[0].options.action.onAction();
      assert.deepEqual(opened, [left]);
      assert.ok(runs.draftRunEstimate() >= 1);
    } finally {
      globalThis.fetch = originalFetch;
      runClient.clear();
    }
  });

  await test("mobile story offers the social carousel and the web grid; the carousel sheet maps CarouselOptions", () => {
    const story = storyModel(items[0], sourceLanguages(sources), true);
    const html = renderToStaticMarkup(h(MobStory, { story, selected: "carousel", hint: "كاروسيل · ٤ شرائح + كابشن · من مصدر واحد", action: "اكتب وارسم الشرائح", onSelect() {}, onGenerate() {} }));
    assert.match(html, /class="m-fmt" role="group" aria-label="صيغ السوشيال"/);
    assert.match(html, /aria-pressed="true"><span class="tile__shape" style="height:92px">[^]*?كاروسيل بصور AI/);
    assert.equal(html.match(/class="tile tile--row"/g)?.length, 4);
    assert.ok(html.indexOf('class="m-cta"') > html.lastIndexOf("</main>"));
    const sheet = renderToStaticMarkup(h(MobCarouselSheet, { open: true, options: { slides: 6, style: "frame", density: "line", mark: false }, onChange() {}, onClose() {}, onGenerate() {} }));
    assert.match(sheet, /role="dialog" aria-modal="true"[^>]*aria-labelledby="cs-title"/);
    assert.match(sheet, /aria-pressed="true">٦<\/button>/);
    assert.match(sheet, /aria-pressed="true"[^>]*><span class="tile__shape"[^]*?بطاقة/);
    assert.match(sheet, /aria-pressed="true">سطر توضيحي<\/button>/);
    assert.match(sheet, /role="switch" aria-checked="false" aria-label="علامة Newsplus"/);
    assert.ok(sheet.includes("اكتب وارسم ٦ شرائح"));
  });

  await test("filters survive the URL and select several sources across both languages", () => {
    const params = writeFilters(new URLSearchParams("item=x"), { time: "hour", topic: "economy", lang: "all", src: ["ar-desk", "en-desk"] });
    assert.equal(params.toString(), "item=x&time=hour&topic=economy&src=ar-desk%2Cen-desk");
    assert.deepEqual(readFilters(params), { time: "hour", topic: "economy", lang: "all", src: ["ar-desk", "en-desk"] });
    assert.deepEqual(readFilters(new URLSearchParams("time=nope&lang=fr&src=a,,a")), { time: "all", topic: "all", lang: "all", src: ["a"] });
    const languages = sourceLanguages(sources);
    const english = { ...items[0], id: "en-story", title: "Desk story", sources: [{ id: "en-desk", name: "English Desk", url: "https://example.com/en" }] };
    const both = [items[0], english];
    const all = { time: "all", topic: "all", lang: "all", src: [] };
    assert.deepEqual(applyFilters(both, { ...all, src: ["ar-desk", "en-desk"] }, languages).map((i) => i.id), ["fixture-story", "en-story"]);
    assert.deepEqual(applyFilters(both, { ...all, src: ["en-desk"] }, languages).map((i) => i.id), ["en-story"]);
    assert.deepEqual(applyFilters(both, { ...all, lang: "ar" }, languages).map((i) => i.id), ["fixture-story"]);
  });

  await test("the filter sheet lists every source with its language and the live result count", () => {
    const html = renderToStaticMarkup(h(FilterSheet, {
      open: true, onClose() {}, sources, resultCount: 1,
      filters: { time: "all", topic: "all", lang: "all", src: ["en-desk"] }, setFilters() {},
    }));
    assert.match(html, /role="dialog" aria-modal="true"/);
    assert.match(html, /aria-label="إغلاق التصفية"/);
    assert.match(html, /class="m-item" type="button" aria-pressed="false"/);
    assert.match(html, /class="m-item" type="button" aria-pressed="true"/);
    assert.ok(html.includes("<small>عربي</small>") && html.includes("<small>English</small>"));
    assert.ok(html.includes("١ من ٢"));
    assert.ok(html.includes("عرض عنوان واحد"));
  });

  await test("wire copy follows the boards", () => {
    assert.equal(countPhrase(2, NEW_HEADLINES), "عنوانان جديدان");
    assert.equal(countPhrase(8, HEADLINES), "٨ عناوين");
    const now = new Date("2026-01-01T12:00:00Z");
    assert.equal(relativeTimeArShort("2026-01-01T11:57:00Z", now), "قبل ٣ د");
    assert.equal(
      emptyText({ mobile: false, topic: "اقتصاد", time: "fresh", sourcesSelected: true, lastSeen: "قبل ٢٦ دقيقة" }),
      "مفيش أخبار اقتصاد في آخر ٢٠ دقيقة من المصادر المختارة. آخر خبر كان قبل ٢٦ دقيقة.",
    );
  });

  await test("briefing pins keep the last eight items, first pinned first", () => {
    const store = new Map();
    const hadWindow = "window" in globalThis;
    globalThis.window ??= globalThis;
    const previous = globalThis.localStorage;
    globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
    try {
      for (let i = 1; i <= 9; i += 1) pins.pinForBriefing(`item-${i}`);
      pins.pinForBriefing("item-5");
      assert.deepEqual(pins.readBriefingPins(), ["item-2", "item-3", "item-4", "item-5", "item-6", "item-7", "item-8", "item-9"]);
      pins.unpinBriefingItems(["item-2", "item-9"]);
      assert.deepEqual(pins.readBriefingPins(), ["item-3", "item-4", "item-5", "item-6", "item-7", "item-8"]);
    } finally {
      globalThis.localStorage = previous;
      if (!hadWindow) delete globalThis.window;
    }
  });

  await test("source marks: the boards’ colour for the outlets they draw, a stable board colour for any other", () => {
    assert.equal(sourceTone("alarabiya"), "#0f6e5d");
    assert.equal(sourceTone("sky-arabia"), "#1d4ed8");
    assert.equal(sourceTone("asharq"), "#c2410c");
    assert.equal(sourceTone("reuters"), "#c2410c");
    assert.equal(sourceTone("bbc-ar"), "#b91c1c");
    assert.equal(sourceTone("aljazeera-ar"), "#a16207");
    assert.equal(sourceTone("al-ain"), "#6d28d9");
    assert.equal(sourceTone("ap"), "#334155");
    const boardColours = ["#0f6e5d", "#1d4ed8", "#c2410c", "#b91c1c", "#a16207", "#6d28d9", "#334155", "#7f1d1d"];
    for (const id of ["youm7", "hespress", "new-source"]) {
      assert.ok(boardColours.includes(sourceTone(id)), id);
      assert.equal(sourceTone(id), sourceTone(id));
    }
  });

  await test("the archive groups drafts by day, names formats and versions per board, and dates the memory rules", () => {
    const now = new Date(2026, 10, 4, 15, 0);
    const at = (days, hours = 0, minutes = 0) => new Date(2026, 10, 4 - days, 15 - hours, -minutes).toISOString();
    const draft = (id, format, versionCount, updatedAt) => ({ id, title: `t-${id}`, format, versionCount, updatedAt });
    const items = [
      draft("a", "video", 3, at(0, 0, 4)),
      draft("b", "social", 1, at(0, 1)),
      draft("c", "desk", 2, at(1, 0)),
      draft("d", "facts", 11, at(3, 0)),
    ];
    const desk = archive.archiveGroups(items, { now, currentId: "b", mobile: false });
    assert.deepEqual(desk.map((group) => group.label), ["اليوم", "أمس", "١ نوفمبر"]);
    assert.deepEqual(desk[0].rows.map((row) => [row.kind, row.format, row.versions, row.time, row.icon]), [
      ["فيديو", "سكريبت فيديو", "٣ نسخ", "قبل ٤ دقائق", "ic-wrap--teal"],
      ["سوشيال", "منشور سوشيال", "نسخة واحدة", "قبل ساعة", "ic-wrap--ai"],
    ]);
    assert.deepEqual(desk[1].rows.map((row) => [row.versions, row.time, row.icon]), [["نسختان", "أمس ٣:٠٠ م", ""]]);
    assert.equal(desk[2].rows[0].versions, "١١ نسخة");
    const mob = archive.archiveGroups(items, { now, currentId: "a", mobile: true });
    assert.equal(archive.rowMeta(mob[0].rows[0]), "سكريبت فيديو · ٣ نسخ · قبل ٤ د");
    assert.equal(archive.rowMeta(mob[0].rows[1]), "منشور سوشيال · نسخة · قبل ساعة");
    assert.equal(archive.rowMeta(mob[1].rows[0]), "خبر مكتبي · نسختان · ٣:٠٠ م");

    const rule = (id, status, createdAt, createdBy = "u1") => ({ id, instruction: `rule ${id}`, rationale: "", status, createdAt, updatedAt: createdAt, createdBy });
    const who = { now, userId: "u1", userName: "سارة", mobile: false };
    assert.equal(archive.ruleMeta(rule("r1", "approved", at(0, 2)), who), "أُضيفت اليوم · من تعديلات سارة");
    assert.equal(archive.ruleMeta(rule("r2", "approved", at(0, 2), "u2"), who), "أُضيفت اليوم");
    assert.equal(archive.ruleMeta(rule("r3", "approved", at(14)), who), "تُطبَّق منذ أسبوعين");
    assert.equal(archive.ruleMeta(rule("r4", "approved", at(31)), { ...who, mobile: true }), "تُطبّق منذ شهر");
    assert.equal(archive.ruleMeta(rule("r5", "disabled", at(40)), who), "موقوفة");
    const split = archive.splitMemory([rule("old", "approved", at(9)), rule("p", "pending", at(0)), rule("x", "rejected", at(0)), rule("new", "disabled", at(1))]);
    assert.deepEqual(split.pending.map((r) => r.id), ["p"]);
    assert.deepEqual(split.rules.map((r) => r.id), ["new", "old"]);
    assert.equal(archive.tabLabel("المسودات", 12), "المسودات · ١٢");
    assert.equal(archive.ruleCounter(58), "٥٨ / ٢٤٠");
    assert.equal(archive.archivePath("memory"), "/archive?tab=memory");
    assert.equal(archive.archiveDrawerPath("drafts"), "/news?archive=drafts");
  });

  await test("the archive drawer is a labelled modal with the board's tabs; the mobile screen lists drafts and rules", () => {
    const iso = new Date().toISOString();
    const archiveClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    archiveClient.setQueryData(["editorial-conversations", ""], { items: [{ id: "c1", title: "مسودة", format: "video", versionCount: 3, updatedAt: iso }] });
    archiveClient.setQueryData(["editorial-memory", "archive"], {
      rules: [
        { id: "p1", instruction: "ابدأ خطافات الأخبار الاقتصادية بسؤال مباشر.", rationale: "", status: "pending", createdAt: iso, updatedAt: iso, createdBy: "u1" },
        { id: "r1", instruction: "تجنب كلمة «صادم» في الخطافات.", rationale: "", status: "disabled", createdAt: iso, updatedAt: iso, createdBy: "u1" },
      ],
    });
    const render = (node) =>
      renderToStaticMarkup(h(QueryClientProvider, { client: archiveClient }, h(ToastProvider, null, h(MemoryRouter, null, node))));
    const desk = render(h(DeskArchive, { tab: "drafts", onTab() {}, currentId: "c1", onOpen() {}, onClose() {} }));
    assert.match(desk, /role="dialog" aria-modal="true"/);
    assert.ok(desk.includes('aria-label="إغلاق الأرشيف"'));
    assert.ok(desk.includes('aria-label="إغلاق"'));
    assert.match(desk, /role="tab" aria-pressed="true" aria-selected="true"[^>]*>المسودات · ١</);
    assert.match(desk, /role="tab" aria-pressed="false" aria-selected="false"[^>]*>ذاكرة الفريق · ١</);
    assert.ok(desk.includes("ic-wrap ic-wrap--ai"));
    assert.ok(desk.includes('role="switch" aria-checked="false" aria-label="تفعيل القاعدة"'));
    const memory = render(h(MobArchive, { tab: "memory", onTab() {} }));
    assert.ok(memory.includes("مقترحة · محتاجة موافقتك"));
    assert.ok(memory.includes("احفظ للفريق"));
    assert.ok(memory.includes("القواعد الحالية"));
    assert.ok(memory.includes("موقوفة"));
    archiveClient.clear();
  });

  // S06 draft: a desk (useEditorialDesk's shape) holding a social draft at its second version.
  const at = new Date().toISOString();
  const copyV1 = { title: "المركزي يثبّت الفائدة", dek: "", summary: "النص الأول", bullets: ["#اقتصاد", "خطاف بديل"], sources: [{ name: "المصدر العربي", url: "https://example.com/a" }], language: "ar", format: "social", conversationId: "c1", versionId: "v1", versionNumber: 1 };
  const copyV2 = { ...copyV1, title: "هل انتهى زمن خفض الفائدة؟", versionId: "v2", versionNumber: 2 };
  const message = (id, role, content, versionId) => ({ id, conversationId: "c1", role, content, versionId, createdAt: at, createdBy: "u1" });
  const draftDesk = (summary, extra = {}) => ({
    summary,
    detail: undefined,
    conversationId: summary.conversationId,
    approvedRules: 4,
    busy: false,
    revising: false,
    restoring: false,
    pendingInstruction: null,
    failedInstruction: null,
    reviseError: null,
    draftError: null,
    instruction: "",
    resultFormat: summary.format,
    carouselOptions: { slides: 4, style: "cinematic", density: "banner", mark: true },
    setInstruction() {}, submitRevision() {}, revise() {}, retryRevision() {}, restore() {}, closeDraft() {}, switchFormat() {},
    saveMemory() {}, dismissMemory() {}, setCarouselOptions() {},
    ...extra,
  });
  const renderDraft = (node) =>
    renderToStaticMarkup(h(QueryClientProvider, { client: new QueryClient() }, h(ToastProvider, null, h(MemoryRouter, null, node))));

  await test("the draft keeps version restoration, the revise dock and quick actions, and marks what the revision changed", () => {
    const detail = {
      id: "c1", title: copyV2.title, format: "social", language: "ar", createdAt: at, updatedAt: at, createdBy: "u1", versionCount: 2,
      status: "draft", assigneeId: "u1", publishedPlatforms: [], commentCount: 0, sourcePacket: "", currentVersionId: "v2", copy: copyV2,
      versions: [
        { id: "v1", conversationId: "c1", number: 1, copy: copyV1, note: "مسودة أولى", createdAt: at, createdBy: "u1" },
        { id: "v2", conversationId: "c1", number: 2, copy: copyV2, note: "حوّلت الخطاف لسؤال.", createdAt: at, createdBy: "u1" },
      ],
      messages: [
        message("m1", "user", "توليد social", "v1"),
        message("m2", "assistant", "مسودة أولى", "v1"),
        message("m3", "user", "اجعل الخطاف سؤالاً", "v2"),
        message("m4", "assistant", "حوّلت الخطاف لسؤال.", "v2"),
      ],
      pendingMemory: [{ id: "r1", instruction: "ابدأ خطافات الأخبار الاقتصادية بسؤال مباشر.", rationale: "لاحظتها من تعديلين متشابهين.", status: "pending", createdAt: at, updatedAt: at, createdBy: "u1" }],
    };
    const desk = draftDesk(copyV2, { detail });
    const html = renderDraft(h(DeskDraft, { desk }));
    assert.ok(html.includes('aria-label="استعادة النسخة ١"'));
    assert.match(html, /aria-current="true" aria-label="النسخة ٢ الحالية"/);
    assert.ok(html.includes('role="list" aria-label="النسخ"'));
    assert.ok(html.includes('aria-label="تحويل الصيغة"'));
    assert.ok(html.includes('aria-label="إرسال"'));
    assert.ok(html.includes('aria-label="المحرّر"'));
    for (const chip of ["اجعل الخطاف سؤالاً", "اختصر دون إضافات", "انسب الادعاءات لأصحابها"]) assert.ok(html.includes(chip), chip);
    assert.ok(html.includes("كتبه المحرّر من مصدر واحد وطبّق ٤ قواعد من ذاكرة الفريق · راجعه قبل النشر"));
    assert.match(html, /class="block is-changed"><div class="block__label">الخطاف · عُدّل في ن٢/);
    assert.ok(html.includes("جهّزت المنشور وطبّقت ٤ قواعد من ذاكرة الفريق."));
    assert.ok(html.includes("حوّلت الخطاف لسؤال. النسخة ٢ محفوظة."));
    assert.doesNotMatch(html, /توليد social|مسودة أولى/);
    assert.ok(html.includes("المحرّر تعلّم قاعدة جديدة"));
    assert.ok(html.includes("نسختان محفوظة"));

    const mobile = renderDraft(h(MobDraft, { desk, onBack() {} }));
    assert.ok(mobile.includes('aria-label="رجوع إلى الخبر"'));
    assert.ok(mobile.includes("حوّله لفيديو"));
    assert.ok(mobile.includes("m-float ai-panel"));
    assert.ok(mobile.includes("اطلب تعديلاً…"));

    const failed = renderDraft(h(MobDraft, { desk: draftDesk(copyV2, { detail, reviseError: new Error("x"), failedInstruction: "اختصر دون إضافات" }), onBack() {} }));
    assert.ok(failed.includes("المحرّر ما قدرش يعدّل"));
    assert.ok(failed.includes("النموذج ما ردّش. طلبك «اختصر دون إضافات» محفوظ."));
    const revising = renderDraft(h(MobDraft, { desk: draftDesk(copyV2, { detail, busy: true, revising: true, pendingInstruction: "قوِّ الهوك" }), onBack() {} }));
    assert.ok(revising.includes("استنى المحرّر يخلص…"));
    assert.ok(revising.includes("يعدّل النص…"));
    assert.ok(revising.includes("قوِّ الهوك"));
  });

  await test("carousel settings preserve slide count, story style, density and the saved brand mark; slide statuses follow S06 §6", () => {
    const slide = (index, status, extra = {}) => ({ index, role: "beat", headline: `شريحة ${index}`, banner: "", attribution: "", scene: "", status, ...extra });
    const carousel = { ...copyV1, format: "carousel", summary: "الكابشن", bullets: ["#اقتصاد"], carousel: { style: "frame", density: "line", mark: false, arc: "sequence", styleLock: "", slides: [slide(0, "ready"), slide(1, "pending"), slide(2, "mismatch", { mismatch: "الصورة لا تطابق النص." }), slide(3, "failed")] } };
    const html = renderDraft(h(DeskCarousel, { desk: draftDesk(carousel, { carouselOptions: { slides: 6, style: "frame", density: "line", mark: false } }), storyTitle: "عنوان الخبر" }));
    assert.ok(html.includes('aria-label="إعدادات الكاروسيل"'));
    assert.match(html, /aria-pressed="true"[^>]*>٦<\/button>/);
    assert.match(html, /aria-pressed="true"[^>]*><span class="tile__shape"[^>]*><span[^>]*><span[^>]*><\/span><span[^>]*>عنوان في إطار<\/span><\/span><\/span><span class="tile__name"[^>]*>بطاقة<\/span>/);
    assert.match(html, /aria-pressed="true"[^>]*>سطر توضيحي<\/button>/);
    assert.match(html, /role="switch" aria-checked="false" aria-label="علامة Newsplus"/);
    assert.ok(html.includes("حدّث الشرائح"));
    for (const status of ["جاهزة", "تُرسم…", "راجعها", "فشل الرسم"]) assert.ok(html.includes(status), status);
    assert.ok(html.includes("الشريحة ٣ لا تطابق نصها"));
    assert.ok(html.includes("الصورة لا تطابق النص."));
    assert.ok(html.includes("تعذّر رسم الشريحة ٤"));
    assert.ok(html.includes("١ جاهزة · ١ تُرسم · ٢ تحتاج مراجعة"));
    assert.ok(html.includes("الكابشن"));
  });
  client.clear();
} finally {
  await vite.close();
}
