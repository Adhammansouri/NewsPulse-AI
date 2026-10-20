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
  const { CarouselControls } = await vite.ssrLoadModule("/src/modules/News/components/CarouselControls.tsx");
  const { NewsToolbar } = await vite.ssrLoadModule("/src/modules/News/components/NewsToolbar.tsx");
  const { SourceSheet } = await vite.ssrLoadModule("/src/modules/News/components/SourceSheet.tsx");
  const { ConversationDrawer } = await vite.ssrLoadModule("/src/modules/News/components/editorial/ConversationDrawer.tsx");
  const { RevisionThread } = await vite.ssrLoadModule("/src/modules/News/components/editorial/RevisionThread.tsx");
  const { EditorialDraft } = await vite.ssrLoadModule("/src/modules/News/components/editorial/EditorialDraft.tsx");
  const { timeFilterCounts, topicFilterCounts } = await vite.ssrLoadModule("/src/modules/News/newsFormat.ts");
  const { sourceHost } = await vite.ssrLoadModule("/src/modules/News/sourceLogos.ts");
  const { SourceMark } = await vite.ssrLoadModule("/src/modules/News/SourceMark.tsx");
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
  const renderPage = (entry = "/news?item=fixture-story") =>
    renderToStaticMarkup(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: [entry] }, h(NewsPage))));

  await test("newsroom exposes all eight editorial formats and preserves the source preview", () => {
    const html = renderPage();
    for (const name of ["مكتبي", "نشرة", "حقائق", "سياق", "سوشيال", "فيديو", "كاروسيل", "موجز الغرفة"]) assert.ok(html.includes(name), `Missing format: ${name}`);
    assert.ok(html.includes(items[0].title));
    assert.ok(html.includes(items[0].excerpt));
    assert.ok(html.includes('href="https://example.com/report"'));
    assert.match(html, /badge-live[^>]*>عاجل/);
    assert.match(html, /wire-title[^>]*dir="rtl"[^>]*lang="ar"/);
  });

  await test("the URL decides what is open and generation sits outside the scrolling story", () => {
    const open = renderPage();
    assert.match(open, /data-work="open"/);
    assert.ok(open.indexOf('class="nr-dock"') > open.lastIndexOf("</article>"));
    assert.match(open, /aria-label="العودة إلى العناوين"/);
    const closed = renderPage("/news");
    assert.match(closed, /data-work="closed"/);
    assert.ok(closed.includes("اختر خبراً للبدء"));
    assert.ok(closed.includes("المحادثات"));
  });

  await test("a story that left the feed is reported instead of silently swapped", () => {
    const html = renderPage("/news?item=gone");
    assert.ok(html.includes("الخبر لم يعد في القائمة"));
  });

  await test("toolbar keeps topics with counts, a reset chip and a mobile filter entry", () => {
    const props = { sources, timeCounts: timeFilterCounts(items), topicCounts: topicFilterCounts(items), onChange() {} };
    const filters = { query: "", language: "all", source: "all", time: "all", topic: "all" };
    const idle = renderToStaticMarkup(h(NewsToolbar, { ...props, filters }));
    assert.ok(idle.includes("تصفية"));
    assert.doesNotMatch(idle, /مسح التصفية/);
    assert.ok(idle.includes('aria-haspopup="dialog"'));
    const active = renderToStaticMarkup(h(NewsToolbar, { ...props, filters: { ...filters, language: "ar", topic: "economy" } }));
    assert.ok(active.includes("مسح التصفية"));
    assert.match(active, /aria-pressed="true"[^>]*aria-label="اقتصاد، 1 عنوان"/);
  });

  await test("source picker lists both languages and marks the selection", () => {
    const html = renderToStaticMarkup(h(SourceSheet, { open: true, sources, selectedId: "en-desk", onClose() {}, onSelect() {} }));
    assert.match(html, /^<dialog/);
    assert.ok(html.includes("مصادر عربية") && html.includes("مصادر إنجليزية"));
    assert.ok(html.includes("المصدر العربي") && html.includes("English Desk"));
    assert.match(html, /source-option is-active" aria-pressed="true"/);
  });

  await test("publisher identity survives redirects and unknown sources retain an initial fallback", () => {
    assert.equal(sourceHost("bbc-ar", "https://news.google.com/rss/articles/redirect"), "bbc.com");
    assert.equal(sourceHost("aljazeera-ar", "https://syndication.example.com/story"), "aljazeera.net");
    assert.equal(sourceHost("new-source", "https://www.publisher.example.com/story"), "publisher.example.com");
    assert.equal(sourceHost("new-source", "https://news.google.com/rss/articles/redirect"), null);
    const fallback = renderToStaticMarkup(h(SourceMark, { id: "new-source", name: "وكالة جديدة", size: 24 }));
    assert.match(fallback, /src-mark is-fallback/);
    assert.doesNotMatch(fallback, /<img/);
  });

  await test("saved conversations and team memory use a native side dialog with a named close control", () => {
    const html = renderToStaticMarkup(h(ConversationDrawer, { open: true, search: "", conversations: [], memory: [], activeId: null, onSearch() {}, onClose() {}, onSelect() {}, onDisableMemory() {} }));
    assert.match(html, /^<dialog/);
    assert.match(html, /is-side/);
    assert.ok(html.includes('aria-label="إغلاق"'));
    assert.ok(html.includes("ذاكرة الفريق"));
  });

  await test("revision view retains version restoration, instructions and quick actions", () => {
    const html = renderToStaticMarkup(h(RevisionThread, {
      id: "news-revision", messages: [], versions: [{ id: "v1", number: 1, note: "الأولى" }, { id: "v2", number: 2, note: "تعديل" }], currentVersionId: "v2", pendingMemory: [], instruction: "", busy: false, format: "desk",
      onInstructionChange() {}, onSubmit() {}, onQuickAction() {}, onRestore() {}, onMemorySave() {}, onMemoryEdit() {}, onMemoryDismiss() {},
    }));
    assert.ok(html.includes('aria-label="استعادة النسخة 1"'));
    assert.ok(html.includes('aria-label="إرسال التعديل"'));
    assert.ok(html.includes("اختصر دون إضافات"));
    assert.ok(html.includes('id="news-revision"'));
  });

  await test("carousel settings preserve slide count, story style, density and the saved brand mark", () => {
    const html = renderToStaticMarkup(h(CarouselControls, { options: { slides: 6, style: "frame", density: "line", mark: false }, busy: false, showApply: true, onChange() {}, onApply() {} }));
    assert.match(html, /aria-label="عدد الشرائح"/);
    assert.match(html, /aria-label="أسلوب النص"/);
    assert.match(html, /aria-label="كثافة نص الشرائح"/);
    assert.match(html, /aria-checked="true"[^>]*>6<\/button>/);
    assert.match(html, /aria-checked="true"[^>]*>بطاقة<\/button>/);
    assert.match(html, /aria-checked="true"[^>]*>سطر توضيحي<\/button>/);
    assert.ok(html.includes("إظهار علامة Newsplus"));
    assert.doesNotMatch(html, /checked=""/);
    assert.ok(html.includes("تحديث الشرائح"));
  });

  await test("a finished draft renders its format-specific structure and sources", () => {
    const base = { title: "عنوان", dek: "مقدمة", summary: "نص الملخص", bullets: ["نقطة أولى"], sources: [{ name: "المصدر", url: "https://example.com/a" }], versionNumber: 2 };
    const video = renderToStaticMarkup(h(EditorialDraft, { data: { ...base, format: "video" }, format: "video" }));
    assert.ok(video.includes("عنوان النشر") && video.includes("لقطات ورسوم"));
    const social = renderToStaticMarkup(h(EditorialDraft, { data: { ...base, format: "social", bullets: ["#خبر #عاجل", "صياغة بديلة"] }, format: "social" }));
    assert.ok(social.includes("صياغات أخرى") && social.includes("#عاجل"));
    const carousel = renderToStaticMarkup(h(EditorialDraft, {
      data: { ...base, format: "carousel", carousel: { style: "cinematic", density: "banner", mark: true, slides: [{ index: 1, headline: "الشريحة الأولى", banner: "شريط" }, { index: 2, headline: "الثانية" }] } },
      format: "carousel",
    }));
    assert.ok(carousel.includes("الشريحة الأولى") && carousel.includes('aria-label="شريحة 1 من 2"'));
    assert.ok(carousel.includes("نسخ الكل"));
    assert.ok(carousel.includes('href="https://example.com/a"'));
  });
  client.clear();
} finally {
  await vite.close();
}
