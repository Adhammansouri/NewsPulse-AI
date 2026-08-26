/**
 * Live editorial eval for Newsplus AI tools.
 * Writes UTF-8 JSON to scripts/.eval-last.json (gitignored via scripts cache).
 */
const BASE = "http://127.0.0.1:3001/api";
const CLICHES = [
  "in conclusion",
  "it's important to note",
  "it is important to note",
  "in today's world",
  "delve",
  "tapestry",
  "landscape of",
  "as an ai",
  "moreover,",
  "furthermore,",
  "لا شك أن",
  "من المهم أن نلاحظ",
  "في الختام",
  "شهدت الساحة",
  "لا يمكن إنكار",
  "في عالمنا اليوم",
];

function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function findCliches(text) {
  const lower = (text || "").toLowerCase();
  return CLICHES.filter((c) => lower.includes(c.toLowerCase()));
}

function arabicRatio(text) {
  const letters = (text || "").replace(/\s/g, "");
  if (!letters) return 0;
  const ar = (letters.match(/[\u0600-\u06FF]/g) || []).length;
  return ar / letters.length;
}

async function req(path, { token, method = "GET", body, timeout = 120_000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({ status: "fail", message: "non-json" }));
    return { ok: res.ok, status: res.status, ms: Date.now() - started, json };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      json: { status: "fail", message: error instanceof Error ? error.message : "fetch-failed" },
    };
  } finally {
    clearTimeout(timer);
  }
}

const cases = [];

function artifactFlags(text) {
  const t = text || "";
  return {
    markdownLink: /\[[^\]]+\]\(https?:/.test(t),
    utmOpenAI: /utm_source=openai/i.test(t),
    parenUrlDump: /\(https?:\/\/[^\s)]+\)/.test(t),
  };
}

function proseFrom(data) {
  if (!data) return "";
  return [data.title, data.dek, data.summary, data.body, data.translated, ...(data.bullets || [])]
    .filter(Boolean)
    .join("\n");
}

function record(id, tool, result, notes = [], expect = { ok: true }) {
  const data = result.json?.data;
  const prose = proseFrom(data);
  const artifacts = artifactFlags(prose);
  const expectedFail = expect.ok === false;
  const statusOk = expectedFail ? !result.ok && result.status === (expect.status ?? 400) : result.ok;
  const artifactFail = !expectedFail && (artifacts.markdownLink || artifacts.utmOpenAI);
  const pass = statusOk && !artifactFail;
  const extra = [];
  if (expectedFail) extra.push(`expect ${expect.status ?? 400}`);
  if (artifacts.markdownLink) extra.push("ARTIFACT markdown-link");
  if (artifacts.utmOpenAI) extra.push("ARTIFACT utm_source=openai");
  if (artifacts.parenUrlDump) extra.push("ARTIFACT paren-url");
  if (expect.minWords && data) {
    const n = wordCount(data.summary || data.body || data.translated);
    extra.push(`words=${n} band=${expect.minWords}-${expect.maxWords ?? "?"}`);
    if (n < expect.minWords || (expect.maxWords && n > expect.maxWords)) extra.push("WORDCOUNT off-band");
  }
  cases.push({
    id,
    tool,
    pass,
    ...result,
    notes: [...notes, ...extra].filter(Boolean),
  });
}

let login = await req("/auth/login", {
  method: "POST",
  body: { identifier: "adham", password: "123456" },
});
if (!login.ok && login.status === 429) {
  await new Promise((r) => setTimeout(r, 2000));
  login = await req("/auth/login", {
    method: "POST",
    body: { identifier: "adham", password: "123456" },
  });
}
if (!login.ok) {
  console.error("login failed", login);
  process.exit(1);
}
const token = login.json.data.token;

const health = await req("/health");
record("health", "system", health, [
  health.json?.data?.openai ? "openai=true" : "openai=false",
  `phase=${health.json?.data?.phase}`,
]);

const sources = await req("/news/sources", { token });
record("news.sources", "news", sources, [`count=${sources.json?.data?.sources?.length ?? 0}`]);

const feed = await req("/news/feed", { token });
const items = feed.json?.data?.items ?? [];
record("news.feed", "news", { ok: feed.ok, status: feed.status, ms: feed.ms, json: { itemCount: items.length, fetchedAt: feed.json?.data?.fetchedAt, sample: items.slice(0, 3) } }, [
  `${items.length} items`,
]);

const arItem = items.find((i) => /[\u0600-\u06FF]/.test(i.title)) ?? items[0];
const enItem = items.find((i) => !/[\u0600-\u06FF]/.test(i.title)) ?? items[0];

if (arItem) {
  const sum = await req("/news/summarize", {
    token,
    method: "POST",
    body: { itemId: arItem.id, language: "ar" },
  });
  const d = sum.json?.data;
  record("news.summarize.item.ar", "news", sum, [
    `srcTitle=${arItem.title}`,
    d ? `arabic=${arabicRatio(d.summary).toFixed(2)}` : "",
    d ? `bullets=${d.bullets?.length}` : "",
    d ? `cliches=${findCliches([d.title, d.dek, d.summary, ...(d.bullets || [])].join("\n")).join("|") || "none"}` : "",
  ], { ok: true, minWords: 90, maxWords: 140 });
}

if (enItem) {
  const sum = await req("/news/summarize", {
    token,
    method: "POST",
    body: { itemId: enItem.id, language: "en" },
  });
  const d = sum.json?.data;
  record("news.summarize.item.en", "news", sum, [
    `srcTitle=${enItem.title}`,
    d ? `cliches=${findCliches([d.title, d.dek, d.summary].join("\n")).join("|") || "none"}` : "",
  ], { ok: true, minWords: 90, maxWords: 140 });
}

const briefing = await req("/news/summarize", {
  token,
  method: "POST",
  body: { briefing: true, language: "ar" },
});
record("news.briefing.ar", "news", briefing, [
  briefing.json?.data ? `bullets=${briefing.json.data.bullets?.length}` : "",
  briefing.json?.data ? `cliches=${findCliches(briefing.json.data.summary).join("|") || "none"}` : "",
], { ok: true, minWords: 90, maxWords: 180 });

const topic = await req("/news/summarize", {
  token,
  method: "POST",
  body: { input: "اتفاق إيران وعمان حول مضيق هرمز", language: "ar" },
  timeout: 150_000,
});
record("news.topic.websearch.ar", "news", topic, [
  topic.json?.data ? `sources=${topic.json.data.sources?.length}` : "",
  topic.json?.data ? `arabic=${arabicRatio(topic.json.data.summary).toFixed(2)}` : "",
], { ok: true, minWords: 90, maxWords: 140 });

const urlFromFeed = items.find((i) => i.sources?.[0]?.url)?.sources[0].url;
if (urlFromFeed) {
  const byUrl = await req("/news/summarize", {
    token,
    method: "POST",
    body: { input: urlFromFeed, language: "ar" },
    timeout: 150_000,
  });
  record("news.url.ar", "news", byUrl, [
    `url=${urlFromFeed}`,
    byUrl.json?.data ? `words=${wordCount(byUrl.json.data.summary)}` : "",
  ]);
}

const genBrief = await req("/generate", {
  token,
  method: "POST",
  body: {
    prompt: "اكتب موجزاً عن فيضانات نيبال والتيبت دون اختراع أرقام غير مؤكدة.",
    style: "brief",
    language: "ar",
    angle: "إنساني دون مبالغة",
  },
});
record("generate.brief.ar", "generate", genBrief, [
  genBrief.json?.data ? `cliches=${findCliches([genBrief.json.data.title, genBrief.json.data.body].join("\n")).join("|") || "none"}` : "",
], { ok: true, minWords: 110, maxWords: 170 });

const genEn = await req("/generate", {
  token,
  method: "POST",
  body: {
    prompt: "Write a news brief on why postal voting rules matter in the US. No invented statistics.",
    style: "brief",
    language: "en",
  },
});
record("generate.brief.en", "generate", genEn, [
  genEn.json?.data ? `cliches=${findCliches(genEn.json.data.body).join("|") || "none"}` : "",
], { ok: true, minWords: 110, maxWords: 170 });

const genArticle = await req("/generate", {
  token,
  method: "POST",
  body: {
    prompt: "مقال قصير عن حل قسد واندماج قواتها في الجيش السوري، بأسلوب مكتبي هادئ.",
    style: "article",
    language: "ar",
    angle: "سياق إقليمي بدون تهويل",
  },
  timeout: 150_000,
});
record("generate.article.ar", "generate", genArticle, [
  genArticle.json?.data ? `cliches=${findCliches(genArticle.json.data.body).join("|") || "none"}` : "",
], { ok: true, minWords: 400, maxWords: 700 });

const trEnAr = await req("/translate", {
  token,
  method: "POST",
  body: {
    text: 'On Wednesday, Prime Minister Keir Starmer said 157 people were killed in the Nepal-Tibet floods. "We are urgently checking on missing Australians," Foreign Minister Penny Wong added.',
    target: "ar",
  },
});
record("translate.en-ar", "translate", trEnAr, [
  trEnAr.json?.data ? `src=${trEnAr.json.data.sourceLanguage}` : "",
  trEnAr.json?.data ? `arabic=${arabicRatio(trEnAr.json.data.translated).toFixed(2)}` : "",
  trEnAr.json?.data ? `keeps157=${String(trEnAr.json.data.translated).includes("157")}` : "",
  trEnAr.json?.data ? `keepsStarmer=${/ستارمر|ستارمر/.test(trEnAr.json.data.translated)}` : "",
]);

const trArEn = await req("/translate", {
  token,
  method: "POST",
  body: {
    text: "أعلنت واشنطن تعليق مواعيد تأشيرات الهجرة للمتقدمين من أنحاء العالم، في خطوة وصفتها مصادر بأنها الأكبر منذ سنوات.",
    target: "en",
  },
});
record("translate.ar-en", "translate", trArEn, [
  trArEn.json?.data ? `src=${trArEn.json.data.sourceLanguage}` : "",
  trArEn.json?.data ? `arabicOut=${arabicRatio(trArEn.json.data.translated).toFixed(2)}` : "",
]);

const empty = await req("/generate", {
  token,
  method: "POST",
  body: { prompt: "", style: "brief", language: "ar" },
});
record("generate.empty.invalid", "generate", empty, [], { ok: false, status: 400 });

const badUrl = await req("/translate", {
  token,
  method: "POST",
  body: { url: "http://127.0.0.1/secret", target: "ar" },
});
record("translate.ssrf.blocked", "translate", badUrl, [
  `code=${badUrl.json?.code || badUrl.json?.error || ""}`,
], { ok: false, status: 400 });

import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

const outPath = join(tmpdir(), "newsplus-eval-last.json");
await writeFile(outPath, JSON.stringify({ at: new Date().toISOString(), cases }, null, 2), "utf8");

for (const c of cases) {
  const flag = c.pass ? "PASS" : "FAIL";
  console.log(`${flag}  ${c.id}  ${c.status}  ${c.ms}ms  ${c.notes.filter(Boolean).join(" | ")}`);
}
const passed = cases.filter((c) => c.pass).length;
console.log(`\n${passed}/${cases.length} passed`);
console.log(`Wrote ${outPath}`);
