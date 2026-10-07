import type { GenerateData, GenerateLanguage, GenerateLength, GenerateStyle, GenerateTone } from "@newsplus/shared";

export const WORD_BAND: Record<GenerateStyle, Record<GenerateLength, string>> = {
  brief: { short: "80–110 كلمة", standard: "120–170 كلمة", long: "180–230 كلمة" },
  article: { short: "300–450 كلمة", standard: "450–700 كلمة", long: "750–950 كلمة" },
  report: { short: "450–650 كلمة", standard: "650–900 كلمة", long: "950–1200 كلمة" },
};

export const STYLES: { id: GenerateStyle; label: string }[] = [
  { id: "brief", label: "ملخص" },
  { id: "article", label: "مقال" },
  { id: "report", label: "تقرير" },
];

export const SOURCE_MODE_LABEL = {
  page: "من الصفحة",
  search: "بالبحث",
  notes: "من التعيين",
} as const;

export const LENGTHS: { id: GenerateLength; label: string }[] = [
  { id: "short", label: "أقصر" },
  { id: "standard", label: "قياسي" },
  { id: "long", label: "أطول" },
];

export const TONES: { id: GenerateTone; label: string }[] = [
  { id: "desk", label: "مكتبي" },
  { id: "formal", label: "رسمي" },
  { id: "explainer", label: "تفسيري" },
];

export const ANGLES = ["اقتصادي", "سياسي", "إنساني", "محلي", "تقني"] as const;

export const STYLE_LABEL: Record<GenerateStyle, string> = {
  brief: "ملخص",
  article: "مقال",
  report: "تقرير",
};

export const STYLE_ACTION: Record<GenerateStyle, string> = {
  brief: "توليد الملخص",
  article: "توليد المقال",
  report: "توليد التقرير",
};

const DRAFTS_KEY = "newsplus-generate-drafts";
const DRAFTS_MAX = 5;

export type GenerateDraft = GenerateData & {
  id: string;
  at: number;
  style: GenerateStyle;
  source: string;
};

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

export function splitHandoff(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return { url: "", notes: "" };
  const match = value.match(/^(https?:\/\/\S+)/i);
  if (match) return { url: match[1], notes: value.slice(match[1].length).trim() };
  return { url: "", notes: value };
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

export function readDrafts(): GenerateDraft[] {
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isGenerateDraft).slice(0, DRAFTS_MAX) : [];
  } catch {
    return [];
  }
}

function isGenerateDraft(value: unknown): value is GenerateDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<GenerateDraft>;
  return typeof draft.id === "string" && typeof draft.at === "number" && Number.isFinite(draft.at)
    && typeof draft.title === "string" && typeof draft.dek === "string" && typeof draft.body === "string"
    && typeof draft.source === "string" && (draft.language === "ar" || draft.language === "en")
    && (draft.style === "brief" || draft.style === "article" || draft.style === "report")
    && (draft.sourceMode === undefined || draft.sourceMode === "page" || draft.sourceMode === "search" || draft.sourceMode === "notes");
}

export function pushDraft(draft: Omit<GenerateDraft, "id" | "at">): GenerateDraft[] {
  const next: GenerateDraft = {
    ...draft,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  const drafts = [next, ...readDrafts().filter((item) => item.title !== next.title)].slice(0, DRAFTS_MAX);
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* private mode */
  }
  return drafts;
}
