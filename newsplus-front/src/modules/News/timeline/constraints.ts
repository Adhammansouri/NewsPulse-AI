// S14: the editor's choice on a source conflict («اعتمد ٢٫٩٪» · «اذكر الرقمين بالإسناد»), kept per story and sent as
// `constraints` with every generation of that story (useEditorialDesk → POST /news/summarize).
// Client-side on purpose: it is one editor's working decision about a feed story that expires within days, made
// before any draft exists, so there is no server record to hang it on. localStorage, bounded: the 40 most recently
// touched stories, one constraint per disputed figure, at most 6 per story (the API's limit), each clipped to the
// API's 300 characters. Unreadable or full storage just means no constraint (the generation still runs).
import type { SourceConflict } from "@newsplus/shared";

const STORAGE_KEY = "np.storyConstraints";
const MAX_STORIES = 40;
/** `NewsSummarizeRequest.constraints`: at most 6, each at most 300 characters (newsplus-API news.schema). */
export const MAX_CONSTRAINTS = 6;
export const MAX_CONSTRAINT_LENGTH = 300;

/** One story's choices: the disputed figure (`field`) → the constraint text. */
type StoryConstraints = { at: number; byField: Record<string, string> };
type Store = Record<string, StoryConstraints>;

/** A conflict's choice: one source's value, or both values with their attribution. */
export type ConflictChoice = { kind: "adopt"; sourceId: string } | { kind: "attribute" };

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: the choice lasts for this screen only.
  }
}

function clip(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length <= MAX_CONSTRAINT_LENGTH ? line : line.slice(0, MAX_CONSTRAINT_LENGTH).trim();
}

/**
 * The instruction the writer gets, e.g. «اذكر نسبة التضخم: ٢٫٩٪ بحسب العربية و٣٫١٪ بحسب سكاي نيوز عربية» (the sprint's
 * example) or «اعتمد نسبة التضخم: ٢٫٩٪ بحسب العربية، ولا تذكر رقماً آخر لها».
 */
export function constraintText(conflict: SourceConflict, choice: ConflictChoice, sourceName: (id: string) => string): string {
  if (choice.kind === "attribute") {
    const parts = conflict.values.map((entry) => `${entry.value} بحسب ${sourceName(entry.sourceId)}`);
    return clip(`اذكر ${conflict.field}: ${parts.join(" و")}`);
  }
  const picked = conflict.values.find((entry) => entry.sourceId === choice.sourceId);
  if (!picked) return "";
  return clip(`اعتمد ${conflict.field}: ${picked.value} بحسب ${sourceName(picked.sourceId)}، ولا تذكر رقماً آخر لها`);
}

/** The constraints to send with a generation of this story (none → []). */
export function readConstraints(itemId: string | null | undefined): string[] {
  if (!itemId) return [];
  const entry = read()[itemId];
  if (!entry || typeof entry.byField !== "object" || entry.byField === null) return [];
  return Object.values(entry.byField)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
    .map(clip)
    .slice(0, MAX_CONSTRAINTS);
}

/** The constraint chosen for one disputed figure of this story ("" when none). */
export function readChoice(itemId: string, field: string): string {
  const text = read()[itemId]?.byField?.[field];
  return typeof text === "string" ? text : "";
}

/** Saves (or replaces) the constraint for one disputed figure; keeps the newest stories and constraints only. */
export function saveConstraint(itemId: string, field: string, text: string, now = Date.now()) {
  const value = clip(text);
  if (!itemId || !field || !value) return;
  const store = read();
  const byField = { ...(store[itemId]?.byField ?? {}) };
  delete byField[field];
  byField[field] = value;
  const fields = Object.keys(byField);
  for (const stale of fields.slice(0, Math.max(0, fields.length - MAX_CONSTRAINTS))) delete byField[stale];
  store[itemId] = { at: now, byField };
  const ids = Object.keys(store).sort((a, b) => (store[b]?.at ?? 0) - (store[a]?.at ?? 0));
  for (const stale of ids.slice(MAX_STORIES)) delete store[stale];
  write(store);
}

/** `NewsSummarizeRequest` spread: `{ constraints }` when this story has any, otherwise nothing. */
export function constraintsFor(itemId: string | null | undefined): { constraints?: string[] } {
  const constraints = readConstraints(itemId);
  return constraints.length > 0 ? { constraints } : {};
}
