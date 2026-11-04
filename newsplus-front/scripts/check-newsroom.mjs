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
  const { CarouselControls } = await vite.ssrLoadModule("/src/modules/News/studio/LegacyStudio.tsx");
  const { FilterSheet } = await vite.ssrLoadModule("/src/modules/News/wire/FilterSheet.tsx");
  const { applyFilters, readFilters, sourceLanguages, writeFilters } = await vite.ssrLoadModule("/src/modules/News/wire/filters.ts");
  const { emptyText, HEADLINES, NEW_HEADLINES } = await vite.ssrLoadModule("/src/modules/News/wire/copy.ts");
  const pins = await vite.ssrLoadModule("/src/modules/News/wire/briefingPins.ts");
  const { countPhrase, relativeTimeArShort } = await vite.ssrLoadModule("/src/utils/arabic.ts");
  const { ToastProvider } = await vite.ssrLoadModule("/src/ui/Toast.tsx");
  const { ConversationDrawer } = await vite.ssrLoadModule("/src/modules/News/components/editorial/ConversationDrawer.tsx");
  const { RevisionThread } = await vite.ssrLoadModule("/src/modules/News/components/editorial/RevisionThread.tsx");
  const { sourceHost } = await vite.ssrLoadModule("/src/modules/News/sourceLogos.ts");
  const { SourceMark } = await vite.ssrLoadModule("/src/modules/News/SourceMark.tsx");
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

  await test("publisher identity survives redirects and unknown sources retain an initial fallback", () => {
    assert.equal(sourceHost("bbc-ar", "https://news.google.com/rss/articles/redirect"), "bbc.com");
    assert.equal(sourceHost("aljazeera-ar", "https://syndication.example.com/story"), "aljazeera.net");
    assert.equal(sourceHost("new-source", "https://www.publisher.example.com/story"), "publisher.example.com");
    assert.equal(sourceHost("new-source", "https://news.google.com/rss/articles/redirect"), null);
    const fallback = renderToStaticMarkup(h(SourceMark, { id: "new-source", name: "وكالة جديدة", size: 24 }));
    assert.match(fallback, /news-source-mark--fallback/);
    assert.doesNotMatch(fallback, /<img/);
  });

  await test("saved conversations and team memory use a native dialog with a named close control", () => {
    const html = renderToStaticMarkup(h(ConversationDrawer, { open: true, search: "", conversations: [], memory: [], activeId: null, onSearch() {}, onClose() {}, onSelect() {}, onDisableMemory() {} }));
    assert.match(html, /^<dialog/);
    assert.ok(html.includes('aria-label="إغلاق المحادثات"'));
    assert.ok(html.includes("ذاكرة الفريق"));
  });

  await test("revision view retains version restoration, instructions and quick actions", () => {
    const html = renderToStaticMarkup(h(RevisionThread, {
      id: "news-editorial-revision", messages: [], versions: [{ id: "v1", number: 1, note: "الأولى" }, { id: "v2", number: 2, note: "تعديل" }], currentVersionId: "v2", pendingMemory: [], instruction: "", busy: false, format: "desk",
      onInstructionChange() {}, onSubmit() {}, onQuickAction() {}, onRestore() {}, onMemorySave() {}, onMemoryEdit() {}, onMemoryDismiss() {},
    }));
    assert.ok(html.includes('aria-label="استعادة النسخة 1"'));
    assert.ok(html.includes('aria-label="إرسال التعديل"'));
    assert.ok(html.includes("اختصر دون إضافات"));
    assert.ok(html.includes('id="news-editorial-revision"'));
  });

  await test("carousel settings preserve slide count, story style, density and the saved brand mark", () => {
    const html = renderToStaticMarkup(h(CarouselControls, { options: { slides: 6, style: "frame", density: "line", mark: false }, busy: false, showApply: true, onChange() {}, onApply() {} }));
    assert.match(html, /aria-label="عدد الشرائح"/);
    assert.match(html, /aria-label="أسلوب النص"/);
    assert.match(html, /aria-label="كثافة نص الشرائح"/);
    assert.match(html, /aria-pressed="true"[^>]*>6<\/button>/);
    assert.match(html, /aria-pressed="true"[^>]*>بطاقة<\/button>/);
    assert.match(html, /aria-pressed="true"[^>]*>سطر توضيحي<\/button>/);
    assert.ok(html.includes("إظهار علامة Newsplus"));
    assert.doesNotMatch(html, /checked=/);
    assert.ok(html.includes("تحديث الشرائح"));
  });
  client.clear();
} finally {
  await vite.close();
}
