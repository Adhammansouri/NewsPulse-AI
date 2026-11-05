import type {
  GenerateData,
  GenerateLanguage,
  GenerateLength,
  GenerateSourceMode,
  GenerateStyle,
  GenerateTone,
} from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

/* ---------- Assignment limits (the API's generate schema) ---------- */

export const ASSIGNMENT_MIN = 3;
export const ASSIGNMENT_MAX = 12_000;
export const ANGLE_MAX = 240;

export const WORD_BAND: Record<GenerateStyle, Record<GenerateLength, string>> = {
  brief: { short: "80–110 كلمة", standard: "120–170 كلمة", long: "180–230 كلمة" },
  article: { short: "300–450 كلمة", standard: "450–700 كلمة", long: "750–950 كلمة" },
  report: { short: "450–650 كلمة", standard: "650–900 كلمة", long: "950–1200 كلمة" },
};

/* ---------- Choices (labels verbatim from DeskGenerate / MobGenerate) ---------- */

export const STYLES: { id: GenerateStyle; label: string }[] = [
  { id: "brief", label: "ملخص" },
  { id: "article", label: "مقال" },
  { id: "report", label: "تقرير" },
];

export const STYLE_LABEL: Record<GenerateStyle, string> = {
  brief: "ملخص",
  article: "مقال",
  report: "تقرير",
};

/** «المحرّر يكتب المقال», «نسخ المقال كاملاً». */
export const STYLE_DEFINITE: Record<GenerateStyle, string> = {
  brief: "الملخص",
  article: "المقال",
  report: "التقرير",
};

export const STYLE_ACTION: Record<GenerateStyle, string> = {
  brief: "اكتب الملخص",
  article: "اكتب المقال",
  report: "اكتب التقرير",
};

/** DeskGenerate tile art: the page outline (`y`, `h`) and its two text bars (`ty`, `ly`) per style. */
export const STYLE_SHAPE: Record<GenerateStyle, { y: number; h: number; ty: number; ly: number }> = {
  brief: { y: 18, h: 28, ty: 26, ly: 36 },
  article: { y: 8, h: 48, ty: 16, ly: 28 },
  report: { y: 6, h: 52, ty: 14, ly: 26 },
};

export const LANGUAGES: { id: GenerateLanguage; label: string }[] = [
  { id: "ar", label: "عربي" },
  { id: "en", label: "English" },
];

export const LENGTHS: { id: GenerateLength; label: string }[] = [
  { id: "short", label: "أقصر" },
  { id: "standard", label: "قياسي" },
  { id: "long", label: "أطول" },
];

export const TONES: { id: GenerateTone; label: string }[] = [
  { id: "desk", label: "مكتبية" },
  { id: "formal", label: "رسمية" },
  { id: "explainer", label: "تفسيرية" },
];

export const ANGLES = ["اقتصادي", "سياسي", "إنساني", "محلي", "تقني"] as const;

export const SOURCE_MODE_LABEL: Record<GenerateSourceMode, string> = {
  page: "من الصفحة",
  search: "بالبحث",
  notes: "من التعيين",
};

const WORD_FORMS: CountForms = { one: "كلمة واحدة", two: "كلمتين", few: "{n} كلمات", many: "{n} كلمة" };
const MINUTE_FORMS: CountForms = { one: "دقيقة", two: "دقيقتين", few: "{n} دقائق", many: "{n} دقيقة" };

/** «٤٥٠–٧٠٠ كلمة» — the tile hint for the chosen length. */
export function wordBand(style: GenerateStyle, length: GenerateLength): string {
  return toArabicDigits(WORD_BAND[style][length]);
}

/** «٤٥٠–٧٠٠» — the mobile tile hint (the range without «كلمة»). */
export function wordRange(style: GenerateStyle, length: GenerateLength): string {
  return wordBand(style, length).replace(" كلمة", "");
}

/** 12000 → «١٢٬٠٠٠» (Arabic-Indic digits, Arabic thousands separator). */
export function groupedArabic(n: number): string {
  return toArabicDigits(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));
}

/** «التعيين حتى ١٢٬٠٠٠ حرف · الزاوية حتى ٢٤٠ حرف». */
export const LIMITS_LINE = `التعيين حتى ${groupedArabic(ASSIGNMENT_MAX)} حرف · الزاوية حتى ${groupedArabic(ANGLE_MAX)} حرف`;

/** «اقتصادي» → «اقتصادية» (it qualifies «زاوية»); a free-text angle is kept as written. */
export function angleAdjective(angle: string): string {
  const value = angle.trim();
  return (ANGLES as readonly string[]).includes(value) ? `${value}ة` : value;
}

/** « بزاوية اقتصادية» (leading space) or "" without an angle. */
export function angleClause(angle: string | undefined): string {
  const value = angle?.trim();
  return value ? ` بزاوية ${angleAdjective(value)}` : "";
}

/* ---------- Source helpers ---------- */

export function looksLikeHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function urlHost(value: string) {
  try {
    return new URL(value.trim()).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function urlLooksBroken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return true;
  if (!looksLikeHttpUrl(trimmed)) return true;
  return !urlHost(trimmed);
}

export function splitHandoff(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return { url: "", notes: "" };
  const match = value.match(/^(https?:\/\/\S+)/i);
  if (match) return { url: match[1], notes: value.slice(match[1].length).trim() };
  return { url: "", notes: value };
}

/**
 * The prompt sent to `POST /generate`. The API opens a source URL only when the prompt starts with it
 * (`page` mode, or `search` when the page is unreachable). `search` is the «ابحث عن الخبر» retry after the
 * site refused the page: the URL moves behind a lead line, so the server skips the fetch and the editor
 * finds the story by web search (the API has no request-level source mode).
 */
export function assignmentPrompt(url: string, notes: string, mode: "auto" | "search" = "auto"): string {
  const source = url.trim();
  const assignment = notes.trim();
  const head = source && mode === "search" ? `Source (unreachable from the server, find this story by web search): ${source}` : source;
  return [head, assignment].filter(Boolean).join("\n\n");
}

export function wordCount(...parts: string[]) {
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function readingMinutes(words: number, language: GenerateLanguage) {
  const wpm = language === "ar" ? 180 : 230;
  return Math.max(1, Math.round(words / wpm));
}

/** «٥١٠ كلمة» */
export function wordsPhrase(words: number): string {
  return words > 999 ? `${groupedArabic(words)} كلمة` : countPhrase(words, WORD_FORMS);
}

/** «٥١٠ كلمة · ٣ دقائق قراءة» */
export function lengthLine(data: Pick<GenerateData, "title" | "dek" | "body" | "language">): string {
  const words = wordCount(data.title, data.dek, data.body);
  return `${wordsPhrase(words)} · ${countPhrase(readingMinutes(words, data.language), MINUTE_FORMS)} قراءة`;
}

/** The body as paragraphs (one per non-empty line). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function packCopy(data: Pick<GenerateData, "title" | "dek" | "body">) {
  return [data.title, data.dek, data.body].filter(Boolean).join("\n\n");
}

export function downloadCopy(data: Pick<GenerateData, "title" | "dek" | "body">, style: GenerateStyle) {
  const blob = new Blob([packCopy(data)], { type: "text/plain;charset=utf-8" });
  const stamp = new Date().toISOString().slice(0, 10);
  const node = document.createElement("a");
  node.href = URL.createObjectURL(blob);
  node.download = `newsplus-${style}-${stamp}.txt`;
  node.click();
  URL.revokeObjectURL(node.href);
}

/* ---------- Drafts («مسوداتي»): this device, newest first, the last 20 ---------- */

const DRAFTS_KEY = "newsplus-generate-drafts";
export const DRAFTS_MAX = 20;

export type GenerateDraft = GenerateData & {
  id: string;
  at: number;
  style: GenerateStyle;
  /** The source URL, or the start of the assignment notes. */
  source: string;
  /** The coverage angle the draft was written with. */
  angle?: string;
};

function isGenerateDraft(value: unknown): value is GenerateDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<GenerateDraft>;
  return typeof draft.id === "string" && typeof draft.at === "number" && Number.isFinite(draft.at)
    && typeof draft.title === "string" && typeof draft.dek === "string" && typeof draft.body === "string"
    && typeof draft.source === "string" && (draft.language === "ar" || draft.language === "en")
    && (draft.style === "brief" || draft.style === "article" || draft.style === "report")
    && (draft.sourceMode === undefined || draft.sourceMode === "page" || draft.sourceMode === "search" || draft.sourceMode === "notes")
    && (draft.angle === undefined || typeof draft.angle === "string");
}

function parseDrafts(raw: string | null): GenerateDraft[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isGenerateDraft) : [];
  } catch {
    return [];
  }
}

/** Newest first, one entry per id, at most `DRAFTS_MAX`. */
function normalize(drafts: GenerateDraft[]): GenerateDraft[] {
  const seen = new Set<string>();
  return [...drafts]
    .sort((a, b) => b.at - a.at)
    .filter((draft) => (seen.has(draft.id) ? false : (seen.add(draft.id), true)))
    .slice(0, DRAFTS_MAX);
}

function writeDrafts(drafts: GenerateDraft[]) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* storage blocked or full: the drafts live for this page only */
  }
}

/**
 * Drafts used to live in `sessionStorage` (lost with the tab). The first read moves any found there into
 * `localStorage`, merged with what is already saved, then drops the session copy so it runs once.
 */
function migrateSessionDrafts() {
  let legacy: GenerateDraft[];
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY);
    if (raw === null) return;
    legacy = parseDrafts(raw);
  } catch {
    return;
  }
  try {
    const current = parseDrafts(localStorage.getItem(DRAFTS_KEY));
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(normalize([...current, ...legacy])));
    sessionStorage.removeItem(DRAFTS_KEY);
  } catch {
    /* localStorage unavailable: leave the session copy for a later read */
  }
}

export function readDrafts(): GenerateDraft[] {
  migrateSessionDrafts();
  try {
    return normalize(parseDrafts(localStorage.getItem(DRAFTS_KEY)));
  } catch {
    return [];
  }
}

export function pushDraft(draft: Omit<GenerateDraft, "id" | "at">): GenerateDraft[] {
  const next: GenerateDraft = {
    ...draft,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  const drafts = normalize([next, ...readDrafts().filter((item) => item.title !== next.title)]);
  writeDrafts(drafts);
  return drafts;
}

export function deleteDraft(id: string): GenerateDraft[] {
  const drafts = readDrafts().filter((draft) => draft.id !== id);
  writeDrafts(drafts);
  return drafts;
}

export function clearDrafts(): GenerateDraft[] {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch {
    /* storage blocked */
  }
  return [];
}
