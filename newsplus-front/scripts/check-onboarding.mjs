// S16: onboarding and voice dictation — the onboarding model (steps, copy, example story, summary, where it ends),
// hook style → team-memory rule, the publish platform order, the wire's default source filter, the preferences
// read, the transcript built from recognition results, and the MobOnboard / NewOnboarding / MobNewVoice markup.
// Run from the workspace root: node newsplus-front/scripts/check-onboarding.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: frontendRoot, configFile: resolve(frontendRoot, "vite.config.ts"), server: { middlewareMode: true, watch: null }, appType: "custom" });

const MIN = 60_000;
const NOW = Date.UTC(2026, 10, 5, 12, 0, 0);
const ago = (minutes) => new Date(NOW - minutes * MIN).toISOString();
const link = (id, name) => ({ id, name, url: `https://${id}.example` });
const item = (id, title, minutes, sources) => ({ id, title, excerpt: "", publishedAt: ago(minutes), breaking: false, topic: "economy", sources });

// QA data (never shipped).
const SOURCES = [
  { id: "alarabiya", name: "العربية", language: "ar" },
  { id: "sky-arabia", name: "سكاي نيوز عربية", language: "ar" },
  { id: "aljazeera-ar", name: "الجزيرة نت", language: "ar" },
  { id: "bbc-ar", name: "BBC News عربي", language: "ar" },
  { id: "reuters", name: "Reuters", language: "en" },
];
const FEED = [
  item("en-newest", "Oil climbs after OPEC+ signals cuts", 1, [link("reuters", "Reuters")]),
  item("ar-newest", "اجتماع طارئ لوزراء الخارجية العرب", 4, [link("bbc-ar", "BBC News عربي")]),
  item("ar-followed", "المركزي يثبت الفائدة للمرة الثالثة", 9, [link("alarabiya", "العربية"), link("sky-arabia", "سكاي نيوز عربية")]),
  item("ar-old", "منتخب مصر يعلن القائمة", 60, [link("alarabiya", "العربية")]),
];

try {
  const model = await vite.ssrLoadModule("/src/modules/Onboarding/onboardingModel.ts");
  const publish = await vite.ssrLoadModule("/src/modules/News/publish/publishModel.ts");
  const filters = await vite.ssrLoadModule("/src/modules/News/wire/filters.ts");
  const prefs = await vite.ssrLoadModule("/src/services/preferencesService.ts");
  const voice = await vite.ssrLoadModule("/src/modules/News/studio/draft/voiceModel.ts");
  const steps = await vite.ssrLoadModule("/src/modules/Onboarding/OnboardingSteps.tsx");
  const { VoicePanel } = await vite.ssrLoadModule("/src/modules/News/studio/draft/VoicePanel.tsx");

  await test("steps: copy verbatim from MobOnboard / NewOnboarding, stepper, CTA and navigation", () => {
    assert.equal(model.stepLabel(1), "الخطوة ١ من ٣");
    assert.equal(model.stepLabel(3), "الخطوة ٣ من ٣");
    assert.deepEqual(model.stepCopy(1, false), { title: "بتنشر فين؟", sub: "هنجهّز الصيغ وحدود الحروف على مقاس منصاتك." });
    assert.deepEqual(model.stepCopy(2, true), { title: "بتتابع مين؟", sub: "العناوين هتيجي من المصادر دي بس." }, "desktop steps 1–2 reuse the mobile copy");
    assert.deepEqual(model.stepCopy(3, false), { title: "علّم المحرّر أسلوبك", sub: "اختار الخطاف الأقرب للي بتكتبه." });
    assert.equal(model.stepCopy(3, true).sub, "اختار الخطاف اللي أقرب للي بتكتبه. هيحفظه كقاعدة في ذاكرة الفريق ويطبّقه من أول مسودة.");
    assert.deepEqual(model.stepperOn(1), [true, false, false]);
    assert.deepEqual(model.stepperOn(2), [true, true, false]);
    assert.deepEqual(model.stepperOn(3), [true, true, true]);
    assert.deepEqual(model.stepCta(1), { label: "التالي", variant: "ink", finish: false });
    assert.deepEqual(model.stepCta(3), { label: "ابدأ الشغل", variant: "ai", finish: true });
    assert.deepEqual([model.nextStep(1), model.nextStep(2), model.nextStep(3)], [2, 3, 3]);
    assert.deepEqual([model.previousStep(1), model.previousStep(2), model.previousStep(3)], [1, 1, 2]);
    assert.deepEqual(model.PLATFORM_ROWS.map((row) => `${row.name} · ${row.note}`), [
      "X · منشورات قصيرة وعاجل",
      "إنستجرام · كاروسيل وصور",
      "فيسبوك · منشورات أطول",
      "تيليجرام · قناة أخبار",
      "تيك توك · سكريبتات فيديو",
    ]);
  });

  await test("choices: toggles, the platforms in the board's order, sources the list knows", () => {
    assert.deepEqual(model.toggle(["x"], "telegram"), ["x", "telegram"]);
    assert.deepEqual(model.toggle(["x", "telegram"], "x"), ["telegram"]);
    assert.deepEqual(model.platformsToSave(["telegram", "x", "instagram"]), ["x", "instagram", "telegram"]);
    assert.deepEqual(model.sourcesToSave(["reuters", "gone", "alarabiya"], SOURCES), ["alarabiya", "reuters"]);
  });

  await test("hook style → the team-memory rule (18–280 characters)", () => {
    assert.deepEqual(model.hookStyleRule("question"), { instruction: "ابدأ خطافات الأخبار بسؤال مباشر يخص القارئ.", rationale: "اختيار المحرّر في أول تشغيل." });
    for (const style of ["direct", "question", "number"]) {
      const { instruction, rationale } = model.hookStyleRule(style);
      assert.ok(instruction.length >= 18 && instruction.length <= 280, style);
      assert.ok(rationale.length >= 1 && rationale.length <= 280, style);
    }
    assert.notEqual(model.hookStyleRule("direct").instruction, model.hookStyleRule("number").instruction);
    assert.deepEqual(model.HOOK_STYLE_ORDER, ["direct", "question", "number"]);
    assert.deepEqual(Object.values(model.HOOK_STYLE_COPY).map((copy) => `${copy.label}: ${copy.note}`), [
      "مباشر: الخبر كما هو، بدون أي إضافة",
      "سؤال: يشد القارئ بسؤال يخصه",
      "رقم: يبدأ برقم واضح",
    ]);
  });

  await test("the example story: the newest headline, from the followed sources, in Arabic first", () => {
    assert.equal(model.exampleStory(FEED, ["alarabiya"]).id, "ar-followed");
    assert.equal(model.exampleStory(FEED, []).id, "ar-newest", "no sources picked: the newest Arabic headline");
    assert.equal(model.exampleStory(FEED, ["aljazeera-ar"]).id, "ar-newest", "nothing from the picked sources");
    assert.equal(model.exampleStory([FEED[0]], ["alarabiya"]).id, "en-newest", "an English-only feed still has an example");
    assert.equal(model.exampleStory([], []), null);
  });

  await test("NewOnboarding's summary: the choices so far, with Arabic counts", () => {
    assert.deepEqual(model.summaryLines({ platforms: [], sources: [], hookStyle: null }), []);
    assert.deepEqual(
      model.summaryLines({ platforms: ["telegram", "x", "instagram"], sources: SOURCES.slice(0, 4), hookStyle: "question" }).map((line) => [line.key, line.text, line.style]),
      [
        ["platforms", "بتنشر على: X، إنستجرام، تيليجرام", false],
        ["sources", "بتتابع ٤ مصادر: العربية، سكاي نيوز عربية، الجزيرة نت…", false],
        ["style", "أسلوبك: خطاف بسؤال", true],
      ],
    );
    assert.equal(model.summaryLines({ platforms: [], sources: SOURCES.slice(0, 1), hookStyle: null })[0].text, "بتتابع مصدر واحد: العربية");
    assert.equal(model.summaryLines({ platforms: [], sources: SOURCES.slice(0, 2), hookStyle: null })[0].text, "بتتابع مصدرين: العربية، سكاي نيوز عربية");
    assert.equal(model.summaryLines({ platforms: [], sources: [], hookStyle: "number" })[0].text, "أسلوبك: خطاف برقم");
  });

  await test("where onboarding ends: the deep link the gate held back, else Home — never /welcome or /login", () => {
    assert.equal(model.onboardingTarget(null), "/");
    assert.equal(model.onboardingTarget({ from: { pathname: "/" } }), "/");
    assert.equal(model.onboardingTarget({ from: { pathname: "/news", search: "?item=n1", hash: "" } }), "/news?item=n1");
    assert.equal(model.onboardingTarget({ from: { pathname: "/welcome" } }), "/");
    assert.equal(model.onboardingTarget({ from: { pathname: "/login" } }), "/");
    assert.equal(model.onboardingTarget({ from: { pathname: "//evil.example" } }), "/");
    assert.equal(model.WELCOME_ROUTE, "/welcome");
  });

  await test("publish: the editor's platforms first, in the board's order; the opening tab", () => {
    assert.deepEqual(publish.orderedPlatforms(undefined), ["x", "instagram", "facebook", "telegram", "tiktok"]);
    assert.deepEqual(publish.orderedPlatforms([]), ["x", "instagram", "facebook", "telegram", "tiktok"]);
    assert.deepEqual(publish.orderedPlatforms(["tiktok", "telegram"]), ["telegram", "tiktok", "x", "instagram", "facebook"]);
    assert.equal(publish.openingPlatform(undefined, "x"), "x");
    assert.equal(publish.openingPlatform([], "instagram"), "instagram", "mobile keeps the board's Instagram");
    assert.equal(publish.openingPlatform(["tiktok", "telegram"], "x"), "telegram");
  });

  await test("publish frame: the newsroom's handle per platform (NewPublish / MobNewPreview), never the editor", () => {
    const parts = { hook: "خطاف", body: "نص", tags: ["#وسم"] };
    const handles = Object.fromEntries(["x", "instagram", "facebook", "telegram", "tiktok"].map((p) => [p, publish.platformView(p, parts).handle]));
    assert.deepEqual(handles, { x: "@newsplus", instagram: "newsplus", facebook: "Newsplus", telegram: "t.me/newsplus", tiktok: "@newsplus" });
  });

  await test("wire: the followed sources are the default source filter, and clearing still shows every source", () => {
    const followed = ["alarabiya", "sky-arabia"];
    const base = { time: "all", topic: "all", lang: "all" };
    assert.deepEqual(filters.readFilters(new URLSearchParams(""), followed), { ...base, src: followed }, "no `src`: the default");
    assert.deepEqual(filters.readFilters(new URLSearchParams("src="), followed), { ...base, src: [] }, "`src=`: every source");
    assert.deepEqual(filters.readFilters(new URLSearchParams("src=reuters"), followed), { ...base, src: ["reuters"] });
    assert.deepEqual(filters.readFilters(new URLSearchParams("")), { ...base, src: [] }, "no default: as before");

    assert.equal(filters.writeFilters(new URLSearchParams("item=x"), { ...base, src: ["sky-arabia", "alarabiya"] }, followed).toString(), "item=x", "the default stays out of the URL");
    assert.equal(filters.writeFilters(new URLSearchParams("item=x"), { ...base, src: [] }, followed).toString(), "item=x&src=", "cleared: every source");
    assert.equal(filters.writeFilters(new URLSearchParams(""), { ...base, src: ["reuters"] }, followed).toString(), "src=reuters");
    assert.equal(filters.writeFilters(new URLSearchParams("src=a"), { ...base, src: [] }).toString(), "", "no default: as before");
    const cleared = filters.writeFilters(new URLSearchParams(""), filters.DEFAULT_FILTERS, followed);
    assert.deepEqual(filters.readFilters(cleared, followed).src, [], "«امسح التصفية» round-trips");

    assert.deepEqual(filters.defaultSources(undefined, SOURCES), []);
    assert.deepEqual(filters.defaultSources(["alarabiya", "gone"], SOURCES), ["alarabiya"], "ids the list no longer has are dropped");
    assert.deepEqual(filters.defaultSources(["alarabiya", "gone"], []), ["alarabiya", "gone"], "kept until the list loads");
    assert.equal(filters.defaultSources(followed, SOURCES), followed, "same reference when nothing changes");
    const items = FEED.map((entry) => ({ ...entry, summary: "" }));
    const languages = filters.sourceLanguages(SOURCES);
    assert.deepEqual(filters.applyFilters(items, filters.readFilters(new URLSearchParams(""), followed), languages).map((entry) => entry.id), ["ar-followed", "ar-old"]);
  });

  await test("preferences read defensively (the gate depends on them)", () => {
    assert.deepEqual(prefs.readPreferences({}), { platforms: [], sources: [] });
    assert.deepEqual(prefs.readPreferences(null), { platforms: [], sources: [] });
    assert.deepEqual(
      prefs.readPreferences({ platforms: ["x", "myspace"], sources: ["alarabiya", 3, ""], hookStyle: "question", onboardedAt: "2026-11-05T10:00:00.000Z" }),
      { platforms: ["x"], sources: ["alarabiya"], hookStyle: "question", onboardedAt: "2026-11-05T10:00:00.000Z" },
    );
    assert.deepEqual(prefs.readPreferences({ platforms: [], sources: [], hookStyle: "emoji", onboardedAt: "" }), { platforms: [], sources: [] });
  });

  await test("voice: settings, the elapsed clock and the transcript", () => {
    assert.equal(voice.VOICE_LANG, "ar-EG");
    assert.equal(voice.VOICE_SILENCE_MS, 2000);
    assert.equal(voice.VOICE_MAX_MS, 60000);
    assert.equal(voice.elapsedLabel(6_400), "٠:٠٦");
    assert.equal(voice.elapsedLabel(61_000), "١:٠١");
    assert.equal(voice.elapsedLabel(-5), "٠:٠٠");
    const piece = (transcript, isFinal) => ({ transcript, isFinal });
    assert.deepEqual(voice.composeTranscript([]), { final: "", interim: "" });
    assert.deepEqual(voice.composeTranscript([piece("اختصر النص لجملتين", true), piece(" وخلّي الخطاف سؤال ", true), piece("عن القروض", false)]), {
      final: "اختصر النص لجملتين وخلّي الخطاف سؤال",
      interim: "عن القروض",
    });
    // Chrome on Android: each result repeats the utterance so far.
    assert.deepEqual(voice.composeTranscript([piece("اختصر", true), piece("اختصر النص", true), piece("اختصر النص لجملتين", false)]), {
      final: "اختصر النص",
      interim: "لجملتين",
    });
    assert.deepEqual(voice.composeTranscript([piece("اختصر النص", true), piece("اختصر النص", true)]), { final: "اختصر النص", interim: "" });
    assert.equal(voice.transcriptText({ final: "اختصر النص", interim: "عن القروض" }), "اختصر النص عن القروض");
    assert.equal(voice.transcriptText({ final: "", interim: "" }), "");
    assert.equal(voice.VOICE_WAVE.length, 14);
  });

  const onboarding = (fields = {}) => ({
    step: 1,
    titleRef: createRef(),
    platforms: ["x", "instagram", "telegram"],
    togglePlatform() {},
    sources: ["alarabiya"],
    sourceList: SOURCES.slice(0, 2),
    sourcesLoading: false,
    sourcesError: null,
    toggleSource() {},
    hookStyle: "question",
    chooseHookStyle() {},
    hooks: { direct: "مباشر-نص", question: "سؤال-نص", number: "رقم-نص" },
    hooksLoading: false,
    hooksError: null,
    retryHooks() {},
    summary: [],
    busy: false,
    finishing: false,
    skipping: false,
    saveError: null,
    next() {},
    back() {},
    skip() {},
    ...fields,
  });

  await test("MobOnboard markup: platform rows, source tiles, hook tiles, the AI note", () => {
    const platforms = renderToStaticMarkup(h(steps.PlatformsStep, { onboarding: onboarding() }));
    assert.match(platforms, /^<button class="tile tile--row" type="button" aria-pressed="true" style="padding:14px"><span class="col grow"><b style="font-size:15px">X<\/b><span class="t-meta">منشورات قصيرة وعاجل<\/span><\/span><span class="check is-on"><svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"><\/path><\/svg><\/span><\/button>/);
    assert.match(platforms, /aria-pressed="false" style="padding:14px"><span class="col grow"><b style="font-size:15px">فيسبوك<\/b><span class="t-meta">منشورات أطول<\/span><\/span><span class="check"><\/span><\/button>/);
    assert.equal((platforms.match(/class="tile tile--row"/g) ?? []).length, 5);

    const sources = renderToStaticMarkup(h(steps.SourcesStep, { onboarding: onboarding() }));
    assert.match(sources, /^<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile tile--row" type="button" aria-pressed="true" style="padding:10px;gap:10px"><span class="mark" style="background:[^;]+;width:30px;height:30px;border-radius:9px">ع<\/span><span class="grow" style="font-size:13.5px;font-weight:600;text-align:start">العربية<\/span><\/button><button class="tile tile--row" type="button" aria-pressed="false"/);
    assert.match(sources, /<p class="t-meta" style="margin-top:6px">تقدر تضيف أو تشيل مصادر بعدين من التصفية.<\/p>$/);
    const sourcesLoading = renderToStaticMarkup(h(steps.SourcesStep, { onboarding: onboarding({ sourcesLoading: true, sourceList: [] }) }));
    assert.equal((sourcesLoading.match(/class="sk"/g) ?? []).length, 16);

    const styles = renderToStaticMarkup(h(steps.StylesStep, { onboarding: onboarding({ step: 3 }), desktop: false }));
    assert.match(styles, /^<p class="t-label">نفس الخبر، ٣ أساليب:<\/p><button class="tile tile--row" type="button" aria-pressed="false" style="padding:14px;align-items:flex-start"><span class="badge badge--topic">مباشر<\/span><b class="grow" style="font-size:14.5px;line-height:1.6">مباشر-نص<\/b><\/button><button class="tile tile--row" type="button" aria-pressed="true" style="padding:14px;align-items:flex-start"><span class="badge badge--ai">سؤال<\/span>/);
    assert.match(styles, /<div class="ai-panel row" style="padding:12px 14px;gap:10px;box-shadow:none;margin-top:6px"><svg class="ic ic--sm"[^>]*><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"><\/path><\/svg><span class="t-small grow">هيتحفظ كقاعدة في ذاكرة الفريق ويتطبّق من أول مسودة.<\/span><\/div>$/);
    const loading = renderToStaticMarkup(h(steps.StylesStep, { onboarding: onboarding({ step: 3, hooks: null, hooksLoading: true }), desktop: false }));
    assert.equal((loading.match(/class="tile tile--row"[^>]*aria-hidden="true"/g) ?? []).length, 3, "three sk rows while the hooks load");
    assert.doesNotMatch(loading, /<button/);
  });

  await test("NewOnboarding markup: the hook tiles with their line and the chosen one's check", () => {
    const html = renderToStaticMarkup(h(steps.StylesStep, { onboarding: onboarding({ step: 3 }), desktop: true }));
    assert.match(html, /<button class="tile tile--row" type="button" aria-pressed="true" style="padding:16px 18px;align-items:flex-start"><span class="badge badge--ai">سؤال<\/span><span class="col grow" style="gap:4px"><b style="font-size:16px;line-height:1.6">سؤال-نص<\/b><span class="t-meta">يشد القارئ بسؤال يخصه<\/span><\/span><span class="tile__check" style="position:static"><svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"><\/path><\/svg><\/span><\/button>/);
    assert.equal((html.match(/tile__check/g) ?? []).length, 1);
    assert.doesNotMatch(html, /ai-panel/, "NewOnboarding says it in its subtitle instead");
    const stepper = renderToStaticMarkup(h(steps.Stepper, { step: 2, style: { maxWidth: "260px" } }));
    assert.equal(stepper, '<div class="stepper" style="max-width:260px"><i class="on"></i><i class="on"></i><i></i></div>');
  });

  await test("MobNewVoice markup: listening line, transcript, wave, the three actions and the note", () => {
    const html = renderToStaticMarkup(h(VoicePanel, { onDone() {} }));
    assert.match(html, /^<section class="col" aria-label="بسمعك…" style="flex:none;padding:18px 18px calc\(28px \+ env\(safe-area-inset-bottom\)\);gap:14px;background:var\(--surface\);border-top:1px solid var\(--line\);box-shadow:0 -18px 40px -24px rgb\(12 35 64 \/ .35\);border-radius:26px 26px 0 0">/);
    assert.match(html, /<div class="row" style="justify-content:space-between"><span class="live" style="color:var\(--cyan\);font-weight:600">بسمعك…<\/span><span class="t-meta num">٠:٠٠<\/span><\/div>/);
    // Only the transcript is live (the clock would be read out every second).
    assert.match(html, /<p aria-live="polite" style="font-size:17px;line-height:1.8;font-weight:500">/);
    assert.match(html, /<span style="display:inline-block;width:2px;height:20px;background:var\(--cyan-dot\);vertical-align:middle;margin-inline-start:2px"><\/span><\/p>/);
    assert.equal((html.match(/<i style="height:\d+px;animation-delay:[\d.]+s"><\/i>/g) ?? []).length, 14);
    assert.match(html, /<button type="button" class="btn btn--ghost">إلغاء<\/button><button class="send" type="button" aria-label="إيقاف وإرسال للمحرّر" style="width:64px;height:64px;border-radius:22px"><svg class="ic ic--lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"><\/path><\/svg><\/button><button type="button" class="btn btn--quiet">عدّل النص<\/button>/);
    assert.match(html, /<p class="t-meta" style="text-align:center">بالعربي أو الإنجليزي · هيتبعت للمحرّر أول ما توقف<\/p><\/section>$/);
  });
} finally {
  await vite.close();
}
