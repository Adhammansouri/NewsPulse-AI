import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

const EN_BANNED = [
  "delve", "tapestry", "leverage", "robust", "pivotal", "crucial", "comprehensive",
  "underscore", "showcase", "moreover", "furthermore", "notably", "it's important to note",
  "in a significant development", "at the end of the day", "testament", "underscores",
  "highlighting", "underscoring", "showcasing",
];

const AR_BANNED = [
  "في تطور لافت", "من المهم أن نذكر", "لا يخفى على أحد", "يلعب دوراً محورياً",
  "يشهد تحولات", "نسيج", "يغوص", "في نهاية المطاف", "تبقى الأيام المقبلة",
  "لا يمكن إنكار", "يشكل نقطة تحول", "يعكس أهمية", "منظومة متكاملة",
];

const PATTERNS = [
  { name: "markdown-bold", re: /\*\*/ },
  { name: "markdown-link", re: /\[.*?\]\(https?:/ },
  { name: "utm-openai", re: /utm_source=openai/i },
  { name: "em-dash-cluster", re: /—.*—/ },
  { name: "binary-contrast-en", re: /it('s| is) not .+?\. (it('s| is)|the)/i },
  { name: "in-conclusion", re: /in conclusion|ultimately,|overall,/i },
  { name: "colon-reveal", re: /:\s+[a-z]/ },
];

function collectText(obj) {
  const parts = [];
  if (!obj?.data) return parts;
  const d = obj.data;
  for (const k of ["title", "dek", "summary", "body", "translated", "original"]) {
    if (d[k]) parts.push({ field: k, text: d[k] });
  }
  if (Array.isArray(d.bullets)) {
    d.bullets.forEach((b, i) => parts.push({ field: `bullets[${i}]`, text: b }));
  }
  return parts;
}

function audit(file) {
  const raw = readFileSync(join(dir, file), "utf8");
  const obj = JSON.parse(raw);
  const findings = [];
  const parts = collectText(obj);

  for (const { field, text } of parts) {
    for (const w of EN_BANNED) {
      if (text.toLowerCase().includes(w.toLowerCase())) {
        findings.push({ file, field, type: "banned-word-en", match: w });
      }
    }
    for (const w of AR_BANNED) {
      if (text.includes(w)) findings.push({ file, field, type: "banned-word-ar", match: w });
    }
    for (const p of PATTERNS) {
      if (p.re.test(text)) findings.push({ file, field, type: p.name, match: p.re.source });
    }
  }

  const wordCount = parts
    .filter((p) => p.field === "summary" || p.field === "body" || p.field === "translated")
    .map((p) => p.text.split(/\s+/).length);

  return { file, timeMs: obj.timeMs, findings, wordCounts: wordCount };
}

const files = [
  "summarize-ar.json",
  "summarize-en.json",
  "generate-brief-ar.json",
  "translate-en-ar.json",
];

const report = files.map(audit);
const totalFindings = report.reduce((n, r) => n + r.findings.length, 0);

console.log(JSON.stringify({ totalFindings, report }, null, 2));
