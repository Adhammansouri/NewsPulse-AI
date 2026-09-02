/**
 * Professional generate matrix — all styles × URL scenarios.
 * Usage: node scripts/test-generate-matrix.mjs
 */
const API = "http://localhost:3001/api";

const CASES = [
  {
    id: "brief-bbc",
    label: "ملخص · BBC",
    body: {
      prompt: "https://www.bbc.co.uk/news/articles/cn8mr1myy2ko",
      style: "brief",
      language: "ar",
      length: "standard",
      tone: "desk",
      angle: "إنساني",
    },
    wordBand: [120, 170],
  },
  {
    id: "article-bbc",
    label: "مقال · BBC",
    body: {
      prompt:
        "https://www.bbc.co.uk/news/articles/cn8mr1myy2ko\n\nركّز على حصيلة الضحايا وتباين الأرقام بين المصادر.",
      style: "article",
      language: "ar",
      length: "standard",
      tone: "formal",
      angle: "سياسي",
    },
    wordBand: [450, 700],
  },
  {
    id: "report-bbc",
    label: "تقرير · BBC",
    body: {
      prompt:
        "https://www.bbc.co.uk/news/articles/cn8mr1myy2ko\n\nتغطية مكتبية: السياق الإقليمي، الردود الرسمية، وتباين الأرقام.",
      style: "report",
      language: "ar",
      length: "standard",
      tone: "explainer",
      angle: "محلي",
    },
    wordBand: [650, 900],
  },
  {
    id: "article-nyt-fallback",
    label: "مقال · NYT (بحث إن حُجب)",
    body: {
      prompt: "https://www.nytimes.com/2026/09/02/world/asia/hong-kong-joshua-wong-activist-guilty.html",
      style: "article",
      language: "ar",
      length: "short",
      tone: "formal",
      angle: "سياسي",
    },
    wordBand: [300, 450],
  },
  {
    id: "report-npr-fallback",
    label: "تقرير · NPR (بحث إن حُجب)",
    body: {
      prompt: "https://www.npr.org/2026/09/02/nx-s1-5952190/chevron-venezuela-oil-deal",
      style: "report",
      language: "ar",
      length: "short",
      tone: "desk",
      angle: "اقتصادي",
    },
    wordBand: [450, 650],
  },
];

function wordCount(...parts) {
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "adham", password: "123456" }),
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(`login failed: ${JSON.stringify(json)}`);
  return json.data.token;
}

async function runCase(token, testCase) {
  const started = Date.now();
  try {
    const res = await fetch(`${API}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testCase.body),
    });
    const json = await res.json();
    const ms = Date.now() - started;

    if (!res.ok || json.status !== "success") {
      return { id: testCase.id, label: testCase.label, ok: false, ms, error: json.message ?? JSON.stringify(json) };
    }

    const { title, dek, body, sourceMode } = json.data;
    const words = wordCount(body);
    const [min, max] = testCase.wordBand;
    const inBand = words >= Math.floor(min * 0.85) && words <= Math.ceil(max * 1.2);

    return {
      id: testCase.id,
      label: testCase.label,
      ok: true,
      ms,
      words,
      wordBand: testCase.wordBand,
      inBand,
      sourceMode,
      title,
      dek: dek?.slice(0, 120) + (dek?.length > 120 ? "…" : ""),
      bodyPreview: body?.slice(0, 180) + (body?.length > 180 ? "…" : ""),
    };
  } catch (err) {
    return { id: testCase.id, label: testCase.label, ok: false, ms: Date.now() - started, error: String(err) };
  }
}

const token = await login();
console.log("Logged in\n");

const results = [];
for (const testCase of CASES) {
  process.stdout.write(`> ${testCase.label} ... `);
  const result = await runCase(token, testCase);
  results.push(result);
  if (result.ok) {
    const band = result.inBand ? "OK" : "OUT OF BAND";
    console.log(`${result.ms}ms · ${result.words} body words · ${result.sourceMode} · ${band}`);
    console.log(`  ${result.title}`);
  } else {
    console.log(`FAIL ${result.error}`);
  }
  console.log("");
}

const passed = results.filter((r) => r.ok).length;
const inBand = results.filter((r) => r.ok && r.inBand).length;
console.log("-".repeat(50));
console.log(`Result: ${passed}/${results.length} ok · ${inBand}/${passed} in band`);

import { writeFileSync } from "node:fs";
writeFileSync("scripts/test-generate-matrix-results.json", JSON.stringify(results, null, 2), "utf8");
