// S13: breaking mode, «اللي فاتك» and the rising topics — pure models plus server-rendered screens.
// Run from the workspace root: node newsplus-front/scripts/check-breaking-digest.mjs
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
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear() };
};
globalThis.localStorage = memoryStorage();
globalThis.window ??= globalThis;

const MIN = 60_000;
const HOUR = 60 * MIN;
// Local-time dates keep the expectations independent of the machine time zone.
const at = (...parts) => new Date(...parts);
const iso = (ms) => new Date(ms).toISOString();
const source = (id, name) => ({ id, name, url: `https://example.com/${id}` });

try {
  const trending = await vite.ssrLoadModule("/src/modules/Home/trending.ts");
  const digest = await vite.ssrLoadModule("/src/modules/Home/digest.ts");
  const model = await vite.ssrLoadModule("/src/modules/News/breaking/breakingModel.ts");
  const { readDeskHandoff } = await vite.ssrLoadModule("/src/services/deskHandoff.ts");
  const { breakingStory } = await vite.ssrLoadModule("/src/modules/Home/homeModel.ts");
  const { ToastProvider } = await vite.ssrLoadModule("/src/ui/Toast.tsx");
  const { DeskBreaking } = await vite.ssrLoadModule("/src/modules/News/breaking/DeskBreaking.tsx");
  const { MobBreaking } = await vite.ssrLoadModule("/src/modules/News/breaking/MobBreaking.tsx");
  const { default: HomePage } = await vite.ssrLoadModule("/src/modules/Home/pages/HomePage.tsx");
  const { MobHome } = await vite.ssrLoadModule("/src/modules/Home/components/MobHome.tsx");
  const { useHome } = await vite.ssrLoadModule("/src/modules/Home/useHome.ts");
  const { useCompose } = await vite.ssrLoadModule("/src/modules/Home/useCompose.ts");

  /* ---------- §4 rising topics ---------- */

  const now = Date.UTC(2026, 10, 4, 12, 0, 0);
  const story = (id, topic, minutesAgo) => ({ id, title: id, excerpt: "", publishedAt: iso(now - minutesAgo * MIN), breaking: false, topic, sources: [source("a", "A")] });
  const feed = [
    // economy: 6 in the last 3h (buckets 1,1,0,1,1,2), 2 before → ×3
    ...[170, 140, 70, 40, 20, 5].map((m, i) => story(`e${i}`, "economy", m)),
    story("e-old1", "economy", 200), story("e-old2", "economy", 350),
    // politics: 3 now, 2 before → ×1.5 → «↑»
    story("p1", "politics", 10), story("p2", "politics", 100), story("p3", "politics", 175),
    story("p-old1", "politics", 190), story("p-old2", "politics", 300),
    // sports: 2 now, 2 before → «ثابت»
    story("s1", "sports", 15), story("s2", "sports", 50), story("s-old1", "sports", 220), story("s-old2", "sports", 230),
    // tech: 1 now, none before → «↑ جديد»
    story("t1", "tech", 25),
    // culture: 1 now, 1 before → «ثابت» (5th: cut by the 4 rows)
    story("c1", "culture", 30), story("c-old", "culture", 250),
    // «أخرى» is not a topic; older than 6h is ignored
    story("o1", "other", 5), story("o2", "other", 6), story("o3", "other", 7), story("o4", "other", 8), story("o5", "other", 9), story("o6", "other", 10), story("o7", "other", 11),
    story("e-ancient", "economy", 400),
  ];

  await test("rising topics: 6 × 30-minute buckets over 3 hours vs the 3 hours before, busiest first, 4 rows", () => {
    const topics = trending.trendingTopics(feed, now);
    assert.deepEqual(topics.map((t) => t.name), ["اقتصاد", "سياسة", "رياضة", "تكنولوجيا"]);
    const [economy, politics, sports, tech] = topics;
    assert.deepEqual(economy.buckets, [1, 1, 0, 1, 1, 2]);
    assert.equal(economy.count, 6);
    assert.equal(economy.previous, 2);
    assert.equal(economy.label, "↑ ٣ أضعاف");
    assert.equal(politics.label, "↑");
    assert.equal(sports.label, "ثابت");
    assert.equal(sports.rising, false);
    assert.equal(tech.label, "↑ جديد");
    assert.equal(tech.ratio, null);
    assert.ok(!topics.some((t) => t.topic === "other"));
  });

  await test("rising labels follow the sprint thresholds and Arabic count grammar", () => {
    const label = (n, prev) => {
      const items = [
        ...Array.from({ length: n }, (_, i) => story(`x${i}`, "health", 10)),
        ...Array.from({ length: prev }, (_, i) => story(`y${i}`, "health", 200)),
      ];
      return trending.trendingTopics(items, now)[0]?.label;
    };
    assert.equal(label(4, 2), "↑ ضعفين", "ratio 2 → ضعفين, not «٢ أضعاف»");
    assert.equal(label(39, 10), "↑ ٤ أضعاف", "3.9 rounds to 4");
    assert.equal(label(12, 1), "↑ ١٢ ضعف");
    assert.equal(label(7, 6), "↑", "1.17 > 1.15");
    assert.equal(label(23, 20), "ثابت", "1.15 is not above 1.15");
    assert.equal(label(1, 3), "ثابت", "falling is «ثابت»");
    assert.equal(label(2, 0), "↑ جديد");
    assert.equal(label(0, 5), undefined, "nothing in the last 3 hours → no row");
  });

  await test("the insight line appears only when a ratio reaches 2, for the highest ratio", () => {
    const topics = trending.trendingTopics(feed, now);
    assert.equal(trending.trendInsight(topics), "الاقتصاد واخد ٣ أضعاف عناوينه المعتادة النهارده. منشور تفسيري ممكن ينجح.");
    assert.equal(trending.trendInsight(topics.filter((t) => t.topic !== "economy")), null, "«↑ جديد» has no ratio");
  });

  await test("spark bars share one scale: 4px quietest … 21px busiest; desktop meta and mobile count", () => {
    assert.deepEqual(trending.sparkHeights([0, 1, 2], 2), [4, 13, 21]);
    assert.deepEqual(trending.sparkHeights([0, 0], 0), [4, 4]);
    assert.equal(trending.busiestBucket(trending.trendingTopics(feed, now)), 2);
    assert.equal(trending.trendMeta(12), "١٢ عنوان · آخر ٣ ساعات");
    assert.equal(trending.trendMeta(9), "٩ عناوين · آخر ٣ ساعات");
    assert.equal(trending.trendCount(2), "عنوانين");
  });

  /* ---------- §3 «اللي فاتك» ---------- */

  await test("the digest shows after 6 hours away, or 05:00–11:00 on a new day", () => {
    const morning = at(2026, 10, 4, 7, 5);
    assert.equal(digest.digestSince(null, morning), null, "no previous visit");
    assert.equal(digest.digestSince(morning.getTime() - 6 * HOUR, morning), morning.getTime() - 6 * HOUR);
    assert.equal(digest.digestSince(morning.getTime() - 6 * HOUR + 1, morning), null, "just under 6 hours, same day");
    const lateYesterday = at(2026, 10, 3, 23, 40).getTime();
    assert.equal(digest.digestSince(lateYesterday, at(2026, 10, 4, 5, 0)), lateYesterday, "05:00, new day, 5h20 away");
    assert.equal(digest.digestSince(lateYesterday, at(2026, 10, 4, 4, 59)), null, "before 05:00");
    assert.equal(digest.digestSince(at(2026, 10, 4, 6, 0).getTime(), at(2026, 10, 4, 10, 0)), null, "same day");
    assert.equal(digest.digestSince(morning.getTime() + MIN, morning), null, "a visit in the future is ignored");
  });

  const data = {
    items: [
      { itemId: "d1", title: "Story one", reason: "الأهم اقتصادياً" },
      { itemId: "d2", title: "Story two", reason: "الأكثر تحديثاً" },
      { itemId: "gone", title: "Story three", reason: "متوقع يتفاعل عليه الجمهور" },
    ],
    summaryText: Array.from({ length: 120 }, () => "كلمة").join(" "),
    sourceCount: 14,
  };
  const digestFeed = [
    { id: "d1", title: "Story one", excerpt: "", publishedAt: iso(now), breaking: false, topic: "economy", sources: ["a", "b", "c", "d"].map((id) => source(id, id)) },
    { id: "d2", title: "Story two", excerpt: "", publishedAt: iso(now), breaking: false, topic: "politics", sources: ["a", "b"].map((id) => source(id, id)) },
  ];

  await test("digest copy: title by the hour, meta with count grammar and reading time, rows with sources · reason", () => {
    assert.equal(digest.hourAr(at(2026, 10, 3, 23, 40)), "١١ م");
    assert.equal(digest.hourAr(at(2026, 10, 4, 0, 10)), "١٢ ص");
    assert.equal(digest.hourAr(at(2026, 10, 4, 12, 0)), "١٢ م");
    assert.equal(digest.digestTitle(at(2026, 10, 3, 23, 40).getTime(), at(2026, 10, 4, 7, 5)), "اللي فاتك من ١١ م لـ ٧ ص");
    assert.equal(digest.readSeconds(data.summaryText), 40, "120 words at 180 a minute");
    assert.equal(digest.digestMeta(data), "لخّصه المحرّر من ١٤ عنوان · تقرأه في ٤٠ ثانية");
    assert.equal(digest.mobDigestMeta(data), "من ١٤ عنوان · ٤٠ ثانية قراءة");
    assert.equal(digest.digestMeta({ ...data, sourceCount: 3, summaryText: "كلمة ".repeat(15) }), "لخّصه المحرّر من ٣ عناوين · تقرأه في ٥ ثوانٍ");
    assert.equal(digest.digestLiveLine(data), "١٤ عنوان جديد من امبارح بالليل");
    assert.deepEqual(digest.digestRows(data, digestFeed), [
      { itemId: "d1", number: "١", title: "Story one", meta: "٤ مصادر · الأهم اقتصادياً", sources: "٤ مصادر" },
      { itemId: "d2", number: "٢", title: "Story two", meta: "مصدرين · الأكثر تحديثاً", sources: "مصدرين" },
      { itemId: "gone", number: "٣", title: "Story three", meta: "متوقع يتفاعل عليه الجمهور", sources: "" },
    ]);
  });

  await test("the briefing hand-off is parsed, and the other hand-offs are unchanged", () => {
    assert.deepEqual(readDeskHandoff({ briefing: true }), { input: undefined, prompt: undefined, source: undefined, itemId: undefined, style: undefined, conversationId: undefined, briefing: true });
    assert.equal(readDeskHandoff({ briefing: "yes" }), null);
    assert.deepEqual(readDeskHandoff({ conversationId: "c1" }), { input: undefined, prompt: undefined, source: undefined, itemId: undefined, style: undefined, conversationId: "c1" });
  });

  /* ---------- §2 breaking mode ---------- */

  await test("breaking links, timer, counts and ready lines", () => {
    assert.equal(model.breakingLink("n 1"), "/news?item=n%201&breaking=1");
    assert.equal(model.breakingPath("n 1"), "/news/n%201/breaking");
    assert.equal(model.isBreakingMode(new URLSearchParams("item=n1&breaking=1")), true);
    assert.equal(model.isBreakingMode(new URLSearchParams("item=n1")), false);
    assert.equal(model.elapsedClock(42_900), "٠٠:٤٢");
    assert.equal(model.elapsedClock(75 * MIN + 3_000), "٧٥:٠٣");
    assert.equal(model.elapsedClock(-5_000), "٠٠:٠٠", "a clock ahead of ours never counts down");
    assert.equal(model.readyLine(4_200), "المحرّر جهّز ٣ صيغ قصيرة في ٤ ثوانٍ. انسخ وانشر، والتفاصيل تيجي بعدين.");
    assert.equal(model.readyLine(12_000), "المحرّر جهّز ٣ صيغ قصيرة في ١٢ ثانية. انسخ وانشر، والتفاصيل تيجي بعدين.");
    assert.equal(model.readyBadge(4_200), "جاهز في ٤ ث");
    assert.equal(model.mobReadyBadge(4_200), "في ٤ ثوانٍ");
    assert.equal(model.mobReadyBadge(300), "في ثانية", "under a second rounds up to one");
    assert.equal(model.postCount("a".repeat(142)), "١٤٢ / ٢٨٠");
    assert.equal(model.alertCount("a".repeat(68)), "٦٨ حرف");
    assert.equal(model.alertCount("a".repeat(5)), "٥ أحرف");
  });

  await test("the post panel shows the text and its trailing hashtags as tags", () => {
    assert.deepEqual(model.splitPost("عاجل | خبر. التفاصيل تتبع. #عاجل #البنك_المركزي"), { text: "عاجل | خبر. التفاصيل تتبع.", tags: ["#عاجل", "#البنك_المركزي"] });
    assert.deepEqual(model.splitPost("عاجل | خبر بلا وسوم"), { text: "عاجل | خبر بلا وسوم", tags: [] });
    assert.deepEqual(model.splitPost("عاجل | #وسم في النص ثم كلام"), { text: "عاجل | #وسم في النص ثم كلام", tags: [] });
  });

  await test("coverage: the first source is the oldest, the others confirm it in arrival order", () => {
    const first = at(2026, 10, 4, 14, 52).getTime();
    const item = { sources: [source("r", "Reuters"), source("sh", "الشرق"), source("sk", "سكاي"), source("ar", "العربية")] };
    assert.deepEqual(model.coverage(item, first), { first: "أول مصدر: العربية · ٢:٥٢ م", confirmed: "أكّده: سكاي، الشرق، Reuters" });
    assert.deepEqual(model.coverage({ sources: [source("ar", "العربية")] }, first), { first: "أول مصدر: العربية · ٢:٥٢ م", confirmed: null });
    assert.deepEqual(model.coverage({ sources: [] }, first), { first: null, confirmed: null });
    assert.equal(model.teammateLine("أحمد", "سكريبت فيديو"), "أحمد بيكتب سكريبت فيديو عن نفس الخبر");
  });

  await test("the timer counts from the earliest publish time seen for the item", () => {
    assert.equal(model.firstPublishedAt({ id: "fp", publishedAt: iso(now) }), now);
    assert.equal(model.firstPublishedAt({ id: "fp", publishedAt: iso(now + 5 * MIN) }), now, "a newer source does not reset it");
    assert.equal(model.firstPublishedAt({ id: "fp", publishedAt: iso(now - MIN) }), now - MIN);
  });

  await test("the home strip keeps the item for breaking mode and the mobile digest's time-only meta", () => {
    const fresh = { id: "b1", title: "خبر", excerpt: "", publishedAt: iso(Date.now() - 3 * MIN), breaking: true, topic: "economy", sources: [source("a", "A"), source("b", "B"), source("c", "C")] };
    const strip = breakingStory([fresh], Date.now());
    assert.equal(strip.meta, "قبل ٣ دقائق · ٣ مصادر");
    assert.equal(strip.time, "قبل ٣ دقائق");
    assert.equal(strip.item, fresh);
  });

  /* ---------- Rendered screens ---------- */

  const breakingItem = {
    id: "n1",
    title: "البنك المركزي يثبت أسعار الفائدة",
    excerpt: "",
    publishedAt: iso(Date.now() - 42_000),
    breaking: true,
    topic: "economy",
    sources: [source("sk", "سكاي نيوز عربية"), source("ar", "العربية")],
  };
  const outputs = { post: "عاجل | المركزي يثبت الفائدة. التفاصيل تتبع. #عاجل #البنك_المركزي", ticker: "عاجل: المركزي يثبّت الفائدة", alert: "المركزي يثبّت الفائدة. اضغط للتفاصيل", ms: 4_200 };
  const render = (client, element, entry = "/") =>
    renderToStaticMarkup(h(QueryClientProvider, { client }, h(ToastProvider, null, h(MemoryRouter, { initialEntries: [entry] }, element))));
  const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

  await test("NewBreaking renders the bar, the three outputs with `arrive`, the switches, coverage and the CTA", () => {
    const client = newClient();
    client.setQueryData(["news-breaking", "n1", 2], outputs);
    const html = render(client, h(DeskBreaking, { item: breakingItem, onExit: () => {} }), "/news?item=n1&breaking=1");
    assert.match(html, /class="breaking-bar" role="status"/);
    assert.match(html, /<span class="num">٠٠:[٠-٩]{2}<\/span> من أول نشر/);
    assert.ok(html.includes("وضع العاجل"));
    assert.ok(html.includes("المحرّر جهّز ٣ صيغ قصيرة في ٤ ثوانٍ. انسخ وانشر، والتفاصيل تيجي بعدين."));
    assert.match(html, /class="badge badge--ai">جاهز في ٤ ث</);
    assert.equal(html.match(/class="panel col arrive"/g)?.length, 3);
    assert.ok(html.includes("منشور عاجل · X") && html.includes("شريط الأخبار") && html.includes("تنبيه للمتابعين"));
    assert.ok(html.includes(model.postCount(outputs.post)), "post count");
    assert.ok(html.includes("سطر واحد") && html.includes(model.alertCount(outputs.alert)));
    assert.match(html, /<p[^>]*>عاجل \| المركزي يثبت الفائدة. التفاصيل تتبع.<\/p>/);
    assert.match(html, /<span class="tag">#عاجل<\/span><span class="tag">#البنك_المركزي<\/span>/);
    assert.equal(html.match(/>نسخ<\/button>/g)?.length, 3);
    assert.match(html, /role="switch" aria-checked="true" aria-label="تحديث تلقائي"/);
    assert.match(html, /role="switch" aria-checked="true" aria-label="تنبيه الفريق"/, "features.workflow is on");
    assert.ok(html.includes("أول مصدر: العربية · "));
    assert.ok(html.includes("أكّده: سكاي نيوز عربية"));
    assert.match(html, /class="btn btn--ai btn--lg" href="\/news\?item=n1"[^>]*>.*اكتب منشور مفصّل/);
  });

  await test("NewBreaking while the editor writes: titled skeleton panels, no ready line or badge", () => {
    const html = render(newClient(), h(DeskBreaking, { item: breakingItem, onExit: () => {} }));
    assert.equal(html.match(/class="sk"/g)?.length, 6);
    assert.ok(!html.includes("badge--ai"));
    assert.ok(!html.includes("المحرّر جهّز"));
    assert.match(html, /aria-busy="true"/);
  });

  await test("MobNewBreaking renders the stacked bar, «٣ صيغ جاهزة», the outputs, one switch and the social CTA", () => {
    const client = newClient();
    client.setQueryData(["news-breaking", "n1", 2], outputs);
    const html = render(client, h(MobBreaking, { item: breakingItem }), "/news/n1/breaking");
    assert.match(html, /class="breaking-bar" role="status" style="padding:14px 16px;flex-direction:column/);
    assert.match(html, /<a class="icon-btn" aria-label="رجوع" style="color:#fff" href="\/news"/, "no history: back to the newsroom");
    assert.match(html, /<b style="font-weight:600">٣ صيغ جاهزة<\/b><span class="badge badge--ai">في ٤ ثوانٍ<\/span>/);
    assert.equal(html.match(/class="panel col arrive"/g)?.length, 3);
    assert.ok(!html.includes('class="tag"'), "the mobile board draws no tags");
    assert.match(html, /m-item__label">حدّث الصيغ لما تيجي تفاصيل<small>المحرّر بيتابع المصادر<\/small>/);
    assert.equal(html.match(/role="switch"/g)?.length, 1);
    assert.match(html, /class="m-cta"><a class="btn btn--ai btn--block btn--lg" href="\/news\/n1"/);
  });

  // Home: «اللي فاتك» under the visit rule, with the rising topics and the breaking strip.
  const homeFeed = [
    breakingItem,
    ...[170, 140, 70, 40, 20].map((m, i) => ({ ...story(`h${i}`, "economy", m), publishedAt: iso(Date.now() - m * MIN) })),
    ...[200, 250].map((m, i) => ({ ...story(`ho${i}`, "economy", m), publishedAt: iso(Date.now() - m * MIN) })),
  ];
  const homeClient = (lastVisit, digestData) => {
    localStorage.setItem("newsplus-last-visit", String(lastVisit));
    const client = newClient();
    client.setQueryData(["news-feed", "all", ""], { fetchedAt: iso(Date.now()), items: homeFeed });
    client.setQueryData(["editorial-conversations", ""], { items: [] });
    client.setQueryData(["editorial-memory"], { rules: [] });
    if (digestData) client.setQueryData(["news-digest", iso(lastVisit)], digestData);
    return client;
  };
  const homeDigest = { items: [{ itemId: "h0", title: "Story h0", reason: "الأهم اقتصادياً" }], summaryText: "ملخص قصير", sourceCount: 14 };

  await test("NewDigest: after 8 hours away the home opens on the digest, the rising topics and the breaking strip", () => {
    const lastVisit = Date.now() - 8 * HOUR;
    const html = render(homeClient(lastVisit, homeDigest), h(HomePage));
    assert.ok(html.includes(`اللي فاتك من ${digest.hourAr(new Date(lastVisit))} لـ `));
    assert.ok(html.includes("لخّصه المحرّر من ١٤ عنوان · تقرأه في ثانية"));
    assert.match(html, /<p class="live">١٤ عنوان جديد من امبارح بالليل<\/p>/);
    assert.match(html, /<span class="t-num" style="font-size:22px;color:var\(--cyan\);width:22px">١<\/span>/);
    assert.ok(html.includes("مصدر واحد · الأهم اقتصادياً"));
    assert.match(html, /href="\/news\?item=h0"[^>]*>اكتب عنه<\/a>/);
    assert.ok(html.includes("حوّله لموجز صباحي") && html.includes("انسخ الملخص") && html.includes("حدّث"));
    assert.ok(html.includes("الموضوعات الصاعدة") && html.includes("من العناوين عندك"));
    assert.ok(html.includes("٦ عناوين · آخر ٣ ساعات"));
    assert.match(html, /class="spark" aria-hidden="true">(<i style="height:\d+px"><\/i>){6}<\/span>/);
    assert.match(html, /href="\/news\?item=n1&amp;breaking=1"[^>]*>.*عاجل الآن.*وضع العاجل<\/span><\/a>/);
    assert.ok(!html.includes("ابدأ من رابط أو فكرة"), "NewDigest draws no compose panel");
  });

  await test("DeskHome stays when the last visit was an hour ago; its strip opens breaking mode", () => {
    const html = render(homeClient(Date.now() - HOUR), h(HomePage));
    assert.ok(!html.includes("اللي فاتك"));
    assert.ok(!html.includes("الموضوعات الصاعدة"));
    assert.ok(html.includes("ابدأ من رابط أو فكرة"));
    assert.match(html, /href="\/news\?item=n1&amp;breaking=1"[^>]*>.*اكتب عنه<\/span><\/a>/);
  });

  await test("a digest with no stories gives the regular home back", () => {
    const lastVisit = Date.now() - 8 * HOUR;
    const html = render(homeClient(lastVisit, { items: [], summaryText: "", sourceCount: 0 }), h(HomePage));
    assert.ok(!html.includes("اللي فاتك"));
    assert.ok(html.includes("ابدأ من رابط أو فكرة"));
  });

  function MobHomeHarness() {
    const home = useHome({ mobile: true, online: true });
    const compose = useCompose({ online: true });
    return h(MobHome, { home, compose, online: true });
  }

  await test("MobNewDigest: «اللي فاتك بالليل», rising cards with 5 bars, «افتح وضع العاجل»", () => {
    const lastVisit = Date.now() - 8 * HOUR;
    const html = render(homeClient(lastVisit, homeDigest), h(MobHomeHarness));
    assert.ok(html.includes("اللي فاتك بالليل"));
    assert.ok(html.includes("من ١٤ عنوان · ثانية قراءة"));
    assert.match(html, /<b style="font-weight:600;font-size:14.5px;line-height:1.6">Story h0<\/b><span class="t-meta">مصدر واحد<\/span>/);
    assert.ok(html.includes("موجز صباحي") && html.includes("انسخ الملخص"));
    assert.ok(html.includes("صاعد دلوقتي") && html.includes("آخر ٣ ساعات"));
    assert.match(html, /class="trend" style="flex:none;min-width:150px">.*?اقتصاد.*?<span class="t-meta">٦ عناوين<\/span>/);
    assert.match(html, /class="spark" aria-hidden="true">(<i style="height:\d+px"><\/i>){5}<\/span>/);
    assert.match(html, /href="\/news\/n1\/breaking"[^>]*>.*عاجل الآن.*افتح وضع العاجل/);
    assert.ok(!html.includes("الصق رابطاً أو اكتب فكرة"), "MobNewDigest draws no compose panel");
    assert.match(html, /<span class="t-meta">[^<]*·[^<]*[صم]<\/span><span class="m-title"/, "the date line carries the clock");
  });

  await test("MobHome's breaking card opens the breaking screen", () => {
    const html = render(homeClient(Date.now() - HOUR), h(MobHomeHarness));
    assert.ok(!html.includes("اللي فاتك"));
    assert.match(html, /href="\/news\/n1\/breaking"[^>]*>.*عاجل الآن.*اكتب عنه/);
  });
} finally {
  await vite.close();
}
