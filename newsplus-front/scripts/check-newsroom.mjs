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
  const { default: NewsPage, CarouselControls } = await vite.ssrLoadModule("/src/modules/News/pages/NewsPage.tsx");
  const { NewsFilters } = await vite.ssrLoadModule("/src/modules/News/components/NewsFilters.tsx");
  const { ConversationDrawer } = await vite.ssrLoadModule("/src/modules/News/components/editorial/ConversationDrawer.tsx");
  const { RevisionThread } = await vite.ssrLoadModule("/src/modules/News/components/editorial/RevisionThread.tsx");
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
  const renderPage = () => renderToStaticMarkup(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: ["/news"] }, h(NewsPage))));

  await test("newsroom exposes all eight editorial formats and preserves the source preview", () => {
    const html = renderPage();
    for (const name of ["مكتبي", "نشرة", "حقائق", "سياق", "سوشيال", "فيديو", "كاروسيل", "موجز"]) assert.ok(html.includes(name), `Missing format: ${name}`);
    assert.ok(html.includes(items[0].title));
    assert.ok(html.includes(items[0].excerpt));
    assert.ok(html.includes('href="https://example.com/report"'));
    assert.match(html, /newsroom-breaking[^>]*>عاجل/);
    assert.match(html, /news-feed-title[^>]*dir="rtl"[^>]*lang="ar"/);
  });

  await test("generation stays outside the scrolling article and mobile navigation names both panes", () => {
    const html = renderPage();
    assert.ok(html.indexOf('class="newsroom-generate-dock"') > html.lastIndexOf("</article>"));
    assert.match(html, /aria-controls="news-feed-pane"/);
    assert.match(html, /aria-controls="news-desk-pane"/);
    assert.match(html, /newsroom-history/);
  });

  await test("source filtering includes both languages and narrows to the selected language", () => {
    const props = { sources, timeCounts: timeFilterCounts(items), topicCounts: topicFilterCounts(items), onChange() {} };
    const filters = { query: "", language: "all", source: "all", time: "all", topic: "all" };
    const all = renderToStaticMarkup(h(NewsFilters, { ...props, filters }));
    assert.match(all, /data-source-id="ar-desk"/);
    assert.match(all, /data-source-id="en-desk"/);
    const arabic = renderToStaticMarkup(h(NewsFilters, { ...props, filters: { ...filters, language: "ar" } }));
    assert.match(arabic, /data-source-id="ar-desk"/);
    assert.doesNotMatch(arabic, /data-source-id="en-desk"/);
    assert.ok(arabic.includes("مسح التصفية"));
    assert.match(all, /aria-expanded="false"[^>]*aria-controls=/);
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

  await test("source logos and removable criteria remain available with the mobile filter panel collapsed", () => {
    const html = renderToStaticMarkup(h(NewsFilters, {
      sources: [{ id: "bbc-ar", name: "BBC News عربي", language: "ar" }, { id: "bbc-world", name: "BBC World", language: "en" }],
      filters: { query: "", language: "ar", source: "bbc-ar", time: "all", topic: "economy" },
      timeCounts: timeFilterCounts(items), topicCounts: topicFilterCounts(items), onChange() {},
    }));
    assert.match(html, /newsroom-source-chip is-active" aria-pressed="true"/);
    assert.match(html, /src="https:\/\/www.google.com\/s2\/favicons\?domain=bbc.com&amp;sz=64"/);
    assert.match(html, /width="24" height="24"/);
    assert.ok(html.includes('aria-label="إزالة فلتر BBC News عربي"'));
    assert.ok(html.includes('aria-label="إزالة فلتر اقتصاد"'));
    assert.ok(html.includes('aria-haspopup="dialog"'));
    assert.ok(html.indexOf('class="newsroom-active-filters"') > html.indexOf('class="newsroom-sources"'));
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
