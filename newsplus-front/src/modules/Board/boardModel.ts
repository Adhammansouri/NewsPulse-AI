// View model of «سير العمل» (S15): the NewBoard kanban and the MobNewQueue list. UI copy is verbatim from
// docs/redesign/design/reference/NewBoard.dc.html and MobNewQueue.dc.html; every value in it comes from the API
// (conversations, assignee, presence). Pure functions — the hook (useBoard) owns the queries.
import {
  EDITORIAL_PUBLISH_PLATFORMS,
  EDITORIAL_WORKFLOW_STATUSES,
  type EditorialConversationListData,
  type EditorialConversationSummary,
  type EditorialPublishPlatform,
  type EditorialWorkflowStatus,
  type NewsSummaryFormat,
  type PresenceEntry,
  type TeamMemberRef,
} from "@newsplus/shared";
import { countPhrase, relativeTimeAr, relativeTimeArShort, type CountForms } from "@/utils/arabic";

/** NewBoard `kcol` order and labels (also the MobNewQueue chips). */
export const COLUMNS: ReadonlyArray<{ status: EditorialWorkflowStatus; label: string }> = [
  { status: "draft", label: "مسودة" },
  { status: "review", label: "مراجعة" },
  { status: "ready", label: "جاهز" },
  { status: "published", label: "اتنشر" },
];

/**
 * The `badge--ai` format name of a card. NewBoard names social «منشور», video «فيديو», carousel «كاروسيل»,
 * desk «خبر مكتبي», briefing «موجز» and facts «حقائق»; bulletin and context are not drawn on the board and take
 * their studio tile names (Main / formats.ts `TILE_COPY`).
 */
const FORMAT_BADGE: Record<NewsSummaryFormat, string> = {
  social: "منشور",
  video: "فيديو",
  carousel: "كاروسيل",
  desk: "خبر مكتبي",
  briefing: "موجز",
  facts: "حقائق",
  bulletin: "نشرة",
  context: "سياق",
};

/** Platform names of the published meta («X · إنستجرام»), as NewPublish `P` names them. */
const PLATFORM_NAME: Record<EditorialPublishPlatform, string> = {
  x: "X",
  instagram: "إنستجرام",
  facebook: "فيسبوك",
  telegram: "تيليجرام",
  tiktok: "تيك توك",
};

const COMMENTS: CountForms = { one: "تعليق واحد", two: "تعليقين", few: "{n} تعليقات", many: "{n} تعليق" };

const MINUTE_MS = 60_000;

export type BoardColumns = Record<EditorialWorkflowStatus, EditorialConversationSummary[]>;

export type BoardData = {
  columns: BoardColumns;
  counts: Record<EditorialWorkflowStatus, number>;
};

export type BoardScope = "team" | "mine";

function isStatus(value: unknown): value is EditorialWorkflowStatus {
  return typeof value === "string" && (EDITORIAL_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

function isPlatform(value: unknown): value is EditorialPublishPlatform {
  return typeof value === "string" && (EDITORIAL_PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

/** Defaults for a summary from an API that predates S15 (status `draft`, assigned to its creator). */
export function normalizeConversation(item: EditorialConversationSummary): EditorialConversationSummary {
  return {
    ...item,
    status: isStatus(item.status) ? item.status : "draft",
    assigneeId: item.assigneeId || item.createdBy,
    publishedPlatforms: Array.isArray(item.publishedPlatforms) ? item.publishedPlatforms.filter(isPlatform) : [],
    commentCount: Number.isFinite(item.commentCount) ? item.commentCount : 0,
  };
}

/**
 * The board from one list response per column. Items are kept only in the column of their own status;
 * the badges use the API's per-status totals, or the column length when an older API sends none.
 */
export function boardFromResponses(responses: ReadonlyArray<EditorialConversationListData>): BoardData {
  const columns = {} as BoardColumns;
  const counts = {} as Record<EditorialWorkflowStatus, number>;
  COLUMNS.forEach(({ status }, index) => {
    const items = (responses[index]?.items ?? []).map(normalizeConversation).filter((item) => item.status === status);
    columns[status] = items;
    counts[status] = responses.find((response) => response.counts)?.counts?.[status] ?? items.length;
  });
  return { columns, counts };
}

export function findCard(data: BoardData, id: string): EditorialConversationSummary | undefined {
  for (const { status } of COLUMNS) {
    const card = data.columns[status].find((item) => item.id === id);
    if (card) return card;
  }
  return undefined;
}

/**
 * The optimistic move: the card leaves its column and heads the target one (the API bumps `updatedAt` and the
 * columns are newest first); both badges follow. Unknown card or same column → unchanged.
 */
export function moveCard(data: BoardData, id: string, to: EditorialWorkflowStatus, at: string): BoardData {
  const card = findCard(data, id);
  if (!card || card.status === to) return data;
  const from = card.status;
  return {
    columns: {
      ...data.columns,
      [from]: data.columns[from].filter((item) => item.id !== id),
      [to]: [{ ...card, status: to, updatedAt: at }, ...data.columns[to]],
    },
    counts: {
      ...data.counts,
      [from]: Math.max(0, data.counts[from] - 1),
      [to]: data.counts[to] + 1,
    },
  };
}

/** The server's copy of a moved card replaces the optimistic one (and keeps the assignee if it came without). */
export function replaceCard(data: BoardData, updated: EditorialConversationSummary): BoardData {
  const card = normalizeConversation(updated);
  const current = findCard(data, card.id);
  if (!current || current.status !== card.status) return data;
  return {
    ...data,
    columns: {
      ...data.columns,
      [card.status]: data.columns[card.status].map((item) =>
        item.id === card.id ? { ...card, assignee: card.assignee ?? item.assignee } : item,
      ),
    },
  };
}

/** First letter of a display name («سارة» → «س»), as the boards' `ava`. */
export function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "";
}

/**
 * The board's compact time: «قبل دقيقة», «قبل ٢٠ د», «قبل ساعة» (NewBoard / MobNewQueue) — the mobile wire's short
 * form, except a single minute which the board spells out.
 */
export function boardTime(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff >= MINUTE_MS && diff < 2 * MINUTE_MS) return relativeTimeAr(iso, now);
  return relativeTimeArShort(iso, now);
}

/** «جاهز من ساعة»: how long the card has sat in «جاهز» (since its last update). */
function readySince(iso: string, now: Date): string {
  const since = boardTime(iso, now).replace(/^قبل /, "");
  return since ? `جاهز من ${since}` : "";
}

/**
 * The card's meta line: the time; in «مراجعة», «مستني مراجعة {assignee}» once the draft is assigned to someone other
 * than its writer; in «جاهز», «جاهز من …»; in «اتنشر», the platforms («X · إنستجرام»). «فحص النشر ٦ من ٦» needs
 * S12's publish check and is not shown.
 */
export function metaLine(card: EditorialConversationSummary, now: Date): string {
  const time = boardTime(card.updatedAt, now);
  switch (card.status) {
    case "review":
      return card.assignee && card.assigneeId !== card.createdBy ? `مستني مراجعة ${card.assignee.displayName}` : time;
    case "ready":
      return readySince(card.updatedAt, now);
    case "published":
      return card.publishedPlatforms.length > 0
        ? card.publishedPlatforms.map((platform) => PLATFORM_NAME[platform]).join(" · ")
        : time;
    default:
      return time;
  }
}

/** «تعليقين» — only when the draft has comments. */
export function commentsLine(card: EditorialConversationSummary): string | null {
  return card.commentCount > 0 ? countPhrase(card.commentCount, COMMENTS) : null;
}

export function formatBadge(format: NewsSummaryFormat): string {
  return FORMAT_BADGE[format] ?? FORMAT_BADGE.desk;
}

/** «سارة بتكتب الآن». */
export function writingLine(name: string): string {
  return `${name} بتكتب الآن`;
}

/** Who is writing each draft right now (the newest `writing` heartbeat per conversation). */
export function writersByConversation(entries: readonly PresenceEntry[]): Map<string, TeamMemberRef> {
  const writers = new Map<string, TeamMemberRef>();
  for (const entry of entries) {
    if (entry.activity !== "writing" || !entry.conversationId || writers.has(entry.conversationId)) continue;
    writers.set(entry.conversationId, entry.user);
  }
  return writers;
}

/** The team members with a live heartbeat, once each, most recent first («٣ أونلاين» + `avas`). */
export function onlineMembers(entries: readonly PresenceEntry[]): TeamMemberRef[] {
  const seen = new Map<string, TeamMemberRef>();
  for (const entry of entries) if (!seen.has(entry.user.id)) seen.set(entry.user.id, entry.user);
  return [...seen.values()];
}

/**
 * MobNewQueue info notice: a teammate (not the viewer) writing one of the drafts on the board —
 * «{name} بتكتب عن «{headline}». …», with the draft's title as the headline. `null` hides the notice.
 */
export function teammateWriting(
  entries: readonly PresenceEntry[],
  data: BoardData | undefined,
  viewerId: string | undefined,
): { name: string; headline: string } | null {
  if (!data) return null;
  for (const entry of entries) {
    if (entry.activity !== "writing" || entry.user.id === viewerId || !entry.conversationId) continue;
    const card = findCard(data, entry.conversationId);
    if (card) return { name: entry.user.displayName, headline: card.title };
  }
  return null;
}
