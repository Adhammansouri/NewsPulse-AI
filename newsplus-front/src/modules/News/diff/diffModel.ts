// S14 «قارن النسخ» (NewDiff / MobNewDiff), pure: each format's fields as the draft shows them (draftModel), a word
// diff per field (jsdiff `diffWords`, split on Arabic and English words with Intl.Segmenter when the browser has
// it), the «{n} حذف» / «{n} إضافة» counts, the side-by-side halves, and the editor's requests between two versions.
import { diffWords, type ChangeObject } from "diff";
import type { EditorialConversationDetail, EditorialVersion, NewsSummarizeData } from "@newsplus/shared";
import { CAROUSEL_COPY, DRAFT_COPY, versionLabel } from "../studio/draft/copy";
import { briefingItems, carouselTags, docShape, socialModel, videoModel } from "../studio/draft/draftModel";

export type DiffPart = { kind: "same" | "del" | "ins"; text: string };

/** `head`: the board's hook line (18px / 600); `body`: `t-body`. */
export type FieldKind = "head" | "body";

export type FieldDiff = {
  key: string;
  label: string;
  kind: FieldKind;
  before: string;
  after: string;
  parts: DiffPart[];
  removed: number;
  added: number;
  changed: boolean;
};

/** `optional`: shown only when it changed (NewDiff draws a video script as its hook, text and shots only). */
type Field = { key: string; label: string; kind: FieldKind; text: string; optional?: boolean };

/** A draft label without its hint: «الهوك · ٠–٣ ثوانٍ» → «الهوك», as NewDiff names the video's hook. */
function plainLabel(label: string): string {
  return label.split(" · ")[0].trim();
}

/** NewDiff's own names for the video script's blocks. */
const VIDEO_LABELS = { hook: "الهوك", script: "النص", shots: "اللقطات" } as const;

/** Every field of the draft's format, in the draft's order, with the draft's labels. */
export function draftFields(data: NewsSummarizeData): Field[] {
  switch (data.format) {
    case "social": {
      const social = socialModel(data);
      return [
        { key: "hook", label: DRAFT_COPY.hook, kind: "head", text: social.hook },
        { key: "body", label: DRAFT_COPY.body, kind: "body", text: social.body },
        { key: "tags", label: DRAFT_COPY.tags, kind: "body", text: social.tags.join(" ") },
        { key: "alts", label: plainLabel(DRAFT_COPY.altsDesk), kind: "body", text: social.alts.join("\n") },
      ];
    }
    case "video": {
      const video = videoModel(data);
      return [
        { key: "title", label: DRAFT_COPY.videoTitle, kind: "head", text: video.title, optional: true },
        { key: "cover", label: DRAFT_COPY.cover, kind: "body", text: video.cover, optional: true },
        { key: "videoHook", label: VIDEO_LABELS.hook, kind: "head", text: video.hook ?? "" },
        { key: "script", label: VIDEO_LABELS.script, kind: "body", text: video.script },
        { key: "shots", label: VIDEO_LABELS.shots, kind: "body", text: video.shots.join("\n") },
      ];
    }
    case "briefing": {
      const items = briefingItems(data);
      return [
        { key: "title", label: DRAFT_COPY.title, kind: "head", text: data.title },
        { key: "items", label: plainLabel(DRAFT_COPY.briefingHead(items.length)), kind: "body", text: items.join("\n") },
      ];
    }
    case "carousel": {
      const slides = (data.carousel?.slides ?? []).map((slide) => ({
        key: `slide-${slide.index}`,
        label: CAROUSEL_COPY.slideN(slide.index + 1),
        kind: "body" as const,
        text: [slide.headline, slide.banner].filter((line) => line.trim()).join("\n"),
      }));
      return [
        ...slides,
        { key: "caption", label: DRAFT_COPY.caption, kind: "body", text: data.summary },
        { key: "tags", label: DRAFT_COPY.tags, kind: "body", text: carouselTags(data).join(" ") },
      ];
    }
    default: {
      const shape = docShape(data.format);
      const points =
        data.format === "facts" ? DRAFT_COPY.pointsFacts : data.format === "context" ? DRAFT_COPY.pointsContext : DRAFT_COPY.pointsDesk;
      const fields: Field[] = [
        { key: "title", label: data.format === "bulletin" ? DRAFT_COPY.bulletinTitle : DRAFT_COPY.title, kind: "head", text: data.title },
      ];
      if (shape.dek) fields.push({ key: "dek", label: DRAFT_COPY.dek, kind: "body", text: data.dek });
      if (shape.body) fields.push({ key: "body", label: DRAFT_COPY.body, kind: "body", text: data.summary });
      if (shape.points) fields.push({ key: "points", label: plainLabel(points), kind: "body", text: data.bullets.join("\n") });
      return fields;
    }
  }
}

type Segmenter = { segment: (input: string) => Iterable<{ segment: string }> };

let segmenter: Segmenter | null | undefined;
/** Word segmentation that knows Arabic (jsdiff's own word characters are Latin only). */
function wordSegmenter(): Segmenter | undefined {
  if (segmenter === undefined) {
    const Ctor = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: "word" }) => Segmenter }).Segmenter;
    segmenter = Ctor ? new Ctor("ar", { granularity: "word" }) : null;
  }
  return segmenter ?? undefined;
}

/** The word diff of one text: unchanged, removed and added runs, in reading order. */
export function wordDiff(before: string, after: string): DiffPart[] {
  if (before === after) return before ? [{ kind: "same", text: before }] : [];
  const seg = wordSegmenter();
  const changes: ChangeObject<string>[] = seg
    ? diffWords(before, after, { intlSegmenter: seg as unknown as Intl.Segmenter })
    : diffWords(before, after);
  const parts: DiffPart[] = changes
    .filter((change) => change.value !== "")
    .map((change) => ({ kind: change.removed ? "del" : change.added ? "ins" : "same", text: change.value }));
  return attachTrailingSpace(parts);
}

/**
 * Text added (or removed) at the very end carries the space before it, as NewDiff marks it
 * («الاتجاه.<ins> فماذا يعني…</ins>»): jsdiff leaves that space outside, in text the older version doesn't have.
 */
function attachTrailingSpace(parts: DiffPart[]): DiffPart[] {
  const last = parts.at(-1);
  const before = parts.at(-2);
  if (!last || !before || last.kind === "same" || before.kind !== "same" || /^\s/.test(last.text)) return parts;
  const space = /\s+$/.exec(before.text)?.[0];
  if (!space) return parts;
  const kept = before.text.slice(0, -space.length);
  return [...parts.slice(0, -2), ...(kept ? [{ kind: "same" as const, text: kept }] : []), { kind: last.kind, text: space + last.text }];
}

/** Field by field, the `to` version's fields (the `from` version's when only it has one), both texts compared. */
export function diffVersions(from: NewsSummarizeData, to: NewsSummarizeData): FieldDiff[] {
  const before = new Map(draftFields(from).map((field) => [field.key, field]));
  const after = draftFields(to);
  const keys = new Set(after.map((field) => field.key));
  const fields = [...after, ...[...before.values()].filter((field) => !keys.has(field.key))];
  return fields
    .map((field) => {
      const beforeText = before.get(field.key)?.text ?? "";
      const afterText = keys.has(field.key) ? field.text : "";
      const parts = wordDiff(beforeText, afterText);
      const removed = parts.filter((part) => part.kind === "del").length;
      const added = parts.filter((part) => part.kind === "ins").length;
      return {
        optional: field.optional === true,
        key: field.key,
        label: field.label,
        kind: field.kind,
        before: beforeText,
        after: afterText,
        parts,
        removed,
        added,
        changed: removed + added > 0,
      };
    })
    .filter((field) => (field.before.trim() !== "" || field.after.trim() !== "") && (!field.optional || field.changed))
    .map(({ optional: _optional, ...field }) => field);
}

/** «{n} حذف» / «{n} إضافة»: removed and added runs over every field. */
export function diffTotals(fields: readonly FieldDiff[]): { removed: number; added: number } {
  return fields.reduce((sum, field) => ({ removed: sum.removed + field.removed, added: sum.added + field.added }), { removed: 0, added: 0 });
}

/** «جنب بعض»: the older version keeps only its deletions, the newer one only its additions. */
export function sideBySide(parts: readonly DiffPart[]): { before: DiffPart[]; after: DiffPart[] } {
  return {
    before: parts.filter((part) => part.kind !== "ins"),
    after: parts.filter((part) => part.kind !== "del"),
  };
}

export type RequestTurn = { key: string; kind: "me" | "ai" | "sys"; text: string };

const RESTORED = /^أُعيدت النسخة (\d+)$/;

/**
 * «إيه اللي اتطلب»: what the editor asked between the two versions — every request and the editor's answer
 * («… ن٢») that made the versions after the older one, up to the newer one. A restore reads «رجعت للنسخة ١».
 */
export function requestsBetween(detail: Pick<EditorialConversationDetail, "messages" | "versions"> | undefined, a: number, b: number): RequestTurn[] {
  if (!detail) return [];
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const versions = new Map(detail.versions.map((version) => [version.id, version]));
  const turns: RequestTurn[] = [];
  for (const message of detail.messages) {
    const version = message.versionId ? versions.get(message.versionId) : undefined;
    if (!version || version.number <= low || version.number > high) continue;
    const text = message.content.trim();
    if (message.role === "user") {
      if (text) turns.push({ key: message.id, kind: "me", text });
    } else if (message.role === "assistant") {
      const restored = RESTORED.exec(text);
      if (restored && text === version.note.trim()) {
        turns.push({ key: message.id, kind: "sys", text: DRAFT_COPY.restoredTo(Number(restored[1])) });
      } else {
        turns.push({ key: message.id, kind: "ai", text: text ? `${text} ${versionLabel(version.number)}` : versionLabel(version.number) });
      }
    }
  }
  return turns;
}

export type ComparePair = { from: EditorialVersion; to: EditorialVersion };

/** NewDiff's default: the first version against the newest (the current one). */
export function defaultPair(versions: readonly EditorialVersion[]): ComparePair | null {
  const sorted = [...versions].sort((a, b) => a.number - b.number);
  const from = sorted[0];
  const to = sorted.at(-1);
  return from && to && from.id !== to.id ? { from, to } : null;
}

/** A side's choices: every version but the other side's (NewDiff: «ن١ | ن٢» against «ن٢ | ن٣»). */
export function sideOptions(versions: readonly EditorialVersion[], other: EditorialVersion): EditorialVersion[] {
  return [...versions].filter((version) => version.id !== other.id).sort((a, b) => a.number - b.number);
}
