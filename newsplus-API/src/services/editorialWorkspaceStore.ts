import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  EditorialConversationDetail,
  EditorialConversationScope,
  EditorialConversationSummary,
  EditorialMemoryRule,
  EditorialMemoryStatus,
  EditorialMessage,
  EditorialMessageRole,
  EditorialVersion,
  NewsLanguage,
  NewsSummarizeData,
  NewsSummaryFormat,
  EditorialPublishPlatform,
  EditorialWorkflowStatus,
} from "@newsplus/shared";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { DEFAULT_WORKFLOW_STATUS, isPublishPlatform, isWorkflowStatus, WORKFLOW_STATUSES } from "./editorialWorkflow.js";

export type StoredEditorialCopy = Omit<NewsSummarizeData, "conversationId" | "versionId" | "versionNumber">;

export type CreateConversationInput = {
  title: string;
  format: NewsSummaryFormat;
  language: NewsLanguage;
  itemId?: string;
  sourceLabel?: string;
  sourcePacket: string;
  copy: StoredEditorialCopy;
  createdBy: string;
  openingNote?: string;
};

export type AddVersionInput = {
  conversationId: string;
  copy: StoredEditorialCopy;
  note: string;
  createdBy: string;
  userMessage?: string;
  expectedVersionId?: string;
};

/** `GET /editorial/conversations` filters (S15). Empty = the pre-S15 list. */
export type ConversationListFilter = {
  scope?: EditorialConversationScope;
  status?: EditorialWorkflowStatus;
  /** The caller — required for `scope: "mine"` (creator or assignee). */
  userId?: string;
};

export type WorkflowPatch = {
  status?: EditorialWorkflowStatus;
  assigneeId?: string;
  publishedPlatforms?: EditorialPublishPlatform[];
};

type ConversationRow = {
  id: string;
  title: string;
  format: string;
  language: string;
  item_id: string | null;
  source_label: string | null;
  source_packet: string;
  current_version_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status?: string | null;
  assignee_id?: string | null;
  published_platforms?: string | null;
  comment_count?: number | null;
  version_count?: number;
};

type VersionRow = {
  id: string;
  conversation_id: string;
  number: number;
  copy_json: string;
  note: string;
  created_by: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  version_id: string | null;
  created_by: string;
  created_at: string;
};

type MemoryRow = {
  id: string;
  instruction: string;
  rationale: string;
  status: string;
  created_by: string;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

function escapeLike(query: string) {
  return query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function parseCopy(raw: string): StoredEditorialCopy {
  return JSON.parse(raw) as StoredEditorialCopy;
}

function withIds(copy: StoredEditorialCopy, conversationId: string, version: Pick<VersionRow, "id" | "number">): NewsSummarizeData {
  return {
    ...copy,
    conversationId,
    versionId: version.id,
    versionNumber: version.number,
  };
}

function mapVersion(row: VersionRow): EditorialVersion {
  const copy = parseCopy(row.copy_json);
  return {
    id: row.id,
    conversationId: row.conversation_id,
    number: row.number,
    copy: withIds(copy, row.conversation_id, row),
    note: row.note,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapMessage(row: MessageRow): EditorialMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as EditorialMessageRole,
    content: row.content,
    versionId: row.version_id ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapMemory(row: MemoryRow): EditorialMemoryRule {
  return {
    id: row.id,
    instruction: row.instruction,
    rationale: row.rationale,
    status: row.status as EditorialMemoryStatus,
    createdBy: row.created_by,
    sourceConversationId: row.source_conversation_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parsePlatforms(raw: string | null | undefined): EditorialPublishPlatform[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isPublishPlatform) : [];
  } catch {
    return [];
  }
}

function mapSummary(row: ConversationRow): EditorialConversationSummary {
  return {
    id: row.id,
    title: row.title,
    format: row.format as NewsSummaryFormat,
    language: row.language as NewsLanguage,
    itemId: row.item_id ?? undefined,
    sourceLabel: row.source_label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    versionCount: Number(row.version_count ?? 0),
    status: isWorkflowStatus(row.status) ? row.status : DEFAULT_WORKFLOW_STATUS,
    assigneeId: row.assignee_id ?? row.created_by,
    publishedPlatforms: parsePlatforms(row.published_platforms),
    commentCount: Number(row.comment_count ?? 0),
  };
}

/**
 * S15 workflow columns, added to `editorial_conversations` by `migrateWorkflowColumns`. The CREATE TABLE keeps the
 * original shape, so fresh and pre-S15 databases take the same path. The defaults back-fill existing rows (status
 * `draft`, no platforms, no comments); `assignee_id` is then back-filled to the creator.
 */
const WORKFLOW_COLUMNS: ReadonlyArray<readonly [name: string, definition: string]> = [
  ["status", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKFLOW_STATUS}'`],
  ["assignee_id", "TEXT"],
  ["published_platforms", "TEXT NOT NULL DEFAULT '[]'"],
  ["comment_count", "INTEGER NOT NULL DEFAULT 0"],
];

const LIST_LIMIT = 50;

export class EditorialWorkspaceStore {
  private readonly db: DatabaseSync;

  constructor(filePath: string) {
    if (filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }
    this.db = new DatabaseSync(filePath);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
    if (filePath !== ":memory:") {
      this.db.exec("PRAGMA journal_mode = WAL;");
    }
    this.migrate();
  }

  close() {
    this.db.close();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS editorial_conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        format TEXT NOT NULL,
        language TEXT NOT NULL,
        item_id TEXT,
        source_label TEXT,
        source_packet TEXT NOT NULL,
        current_version_id TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS editorial_versions (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        number INTEGER NOT NULL,
        copy_json TEXT NOT NULL,
        note TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES editorial_conversations(id)
      );

      CREATE TABLE IF NOT EXISTS editorial_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        version_id TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES editorial_conversations(id)
      );

      CREATE TABLE IF NOT EXISTS editorial_memory_rules (
        id TEXT PRIMARY KEY,
        instruction TEXT NOT NULL,
        rationale TEXT NOT NULL,
        status TEXT NOT NULL,
        created_by TEXT NOT NULL,
        source_conversation_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS editorial_conversations_updated_idx
        ON editorial_conversations (updated_at DESC);
      CREATE INDEX IF NOT EXISTS editorial_versions_conversation_idx
        ON editorial_versions (conversation_id, number);
      CREATE INDEX IF NOT EXISTS editorial_messages_conversation_idx
        ON editorial_messages (conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS editorial_memory_status_idx
        ON editorial_memory_rules (status, updated_at DESC);
    `);
    this.migrateWorkflowColumns();
  }

  /** Idempotent: adds the missing S15 columns, back-fills the assignee, and indexes the board query. */
  private migrateWorkflowColumns() {
    const existing = new Set(
      (this.db.prepare("PRAGMA table_info(editorial_conversations)").all() as Array<{ name: string }>).map(
        (column) => column.name,
      ),
    );
    this.db.exec("BEGIN");
    try {
      for (const [name, definition] of WORKFLOW_COLUMNS) {
        if (!existing.has(name)) this.db.exec(`ALTER TABLE editorial_conversations ADD COLUMN ${name} ${definition}`);
      }
      this.db.exec("UPDATE editorial_conversations SET assignee_id = created_by WHERE assignee_id IS NULL");
      this.db.exec(
        "CREATE INDEX IF NOT EXISTS editorial_conversations_status_idx ON editorial_conversations (status, updated_at DESC)",
      );
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  createConversation(input: CreateConversationInput): EditorialConversationDetail {
    const createdAt = nowIso();
    const conversationId = randomUUID();
    const versionId = randomUUID();
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    const note = input.openingNote?.trim() || "مسودة أولى";

    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(
          `INSERT INTO editorial_conversations (
            id, title, format, language, item_id, source_label, source_packet,
            current_version_id, created_by, created_at, updated_at,
            status, assignee_id, published_platforms, comment_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 0)`,
        )
        .run(
          conversationId,
          input.title,
          input.format,
          input.language,
          input.itemId ?? null,
          input.sourceLabel ?? null,
          input.sourcePacket,
          versionId,
          input.createdBy,
          createdAt,
          createdAt,
          DEFAULT_WORKFLOW_STATUS,
          input.createdBy,
        );

      this.db
        .prepare(
          `INSERT INTO editorial_versions (
            id, conversation_id, number, copy_json, note, created_by, created_at
          ) VALUES (?, ?, 1, ?, ?, ?, ?)`,
        )
        .run(versionId, conversationId, JSON.stringify(input.copy), note, input.createdBy, createdAt);

      this.db
        .prepare(
          `INSERT INTO editorial_messages (
            id, conversation_id, role, content, version_id, created_by, created_at
          ) VALUES (?, ?, 'user', ?, ?, ?, ?)`,
        )
        .run(userMessageId, conversationId, `توليد ${input.format}`, versionId, input.createdBy, createdAt);

      this.db
        .prepare(
          `INSERT INTO editorial_messages (
            id, conversation_id, role, content, version_id, created_by, created_at
          ) VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
        )
        .run(assistantMessageId, conversationId, note, versionId, input.createdBy, createdAt);

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return this.getConversation(conversationId);
  }

  /**
   * Newest first, at most 50. Without a filter this is the pre-S15 list (title / source search only).
   * `status` keeps one board column; `scope: "mine"` keeps the caller's drafts (creator or assignee).
   */
  listConversations(query = "", filter: ConversationListFilter = {}): EditorialConversationSummary[] {
    const where = this.listWhere(query, filter);
    const sql = `
      SELECT c.*,
        (SELECT COUNT(*) FROM editorial_versions v WHERE v.conversation_id = c.id) AS version_count
      FROM editorial_conversations c
      WHERE ${where.sql}${filter.status ? " AND c.status = ?" : ""}
      ORDER BY c.updated_at DESC
      LIMIT ${LIST_LIMIT}
    `;
    const params = filter.status ? [...where.params, filter.status] : where.params;
    const rows = this.db.prepare(sql).all(...params) as ConversationRow[];
    return rows.map(mapSummary);
  }

  /** Totals per workflow status for the same search and scope (the board's column badges). */
  countByStatus(query = "", filter: Omit<ConversationListFilter, "status"> = {}): Record<EditorialWorkflowStatus, number> {
    const where = this.listWhere(query, filter);
    const rows = this.db
      .prepare(
        `SELECT c.status AS status, COUNT(*) AS total FROM editorial_conversations c WHERE ${where.sql} GROUP BY c.status`,
      )
      .all(...where.params) as Array<{ status: string; total: number }>;
    const counts = Object.fromEntries(WORKFLOW_STATUSES.map((status) => [status, 0])) as Record<
      EditorialWorkflowStatus,
      number
    >;
    for (const row of rows) {
      if (isWorkflowStatus(row.status)) counts[row.status] += Number(row.total);
    }
    return counts;
  }

  /** The search (pre-S15) and scope part of the list / count WHERE clause. */
  private listWhere(query: string, filter: Omit<ConversationListFilter, "status">) {
    const trimmed = query.trim();
    const like = trimmed ? `%${escapeLike(trimmed)}%` : "";
    let sql = "(? = '' OR c.title LIKE ? ESCAPE '\\' OR IFNULL(c.source_label, '') LIKE ? ESCAPE '\\')";
    const params: string[] = [trimmed, like, like];
    if (filter.scope === "mine") {
      const userId = filter.userId ?? "";
      sql += " AND (c.assignee_id = ? OR c.created_by = ?)";
      params.push(userId, userId);
    }
    return { sql, params };
  }

  getConversationSummary(id: string): EditorialConversationSummary {
    const row = this.db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM editorial_versions v WHERE v.conversation_id = c.id) AS version_count
         FROM editorial_conversations c WHERE c.id = ?`,
      )
      .get(id) as ConversationRow | undefined;
    if (!row) throw new NotFoundError();
    return mapSummary(row);
  }

  /**
   * S15 `PATCH`: sets the given workflow fields. When anything changed it bumps `updated_at` (the board and
   * «كمّل شغلك» order by it) and logs `systemMessage`, if given, as a `system` message on the current version.
   */
  updateWorkflow(
    id: string,
    patch: WorkflowPatch,
    options: { actorId: string; systemMessage?: string },
  ): EditorialConversationSummary {
    const current = this.getConversationSummary(id);
    const next = {
      status: patch.status ?? current.status,
      assigneeId: patch.assigneeId ?? current.assigneeId,
      publishedPlatforms: patch.publishedPlatforms ?? current.publishedPlatforms,
    };
    const changed =
      next.status !== current.status ||
      next.assigneeId !== current.assigneeId ||
      JSON.stringify(next.publishedPlatforms) !== JSON.stringify(current.publishedPlatforms);
    if (!changed) return current;

    const updatedAt = nowIso();
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(
          "UPDATE editorial_conversations SET status = ?, assignee_id = ?, published_platforms = ?, updated_at = ? WHERE id = ?",
        )
        .run(next.status, next.assigneeId, JSON.stringify(next.publishedPlatforms), updatedAt, id);
      if (options.systemMessage) {
        const row = this.db
          .prepare("SELECT current_version_id FROM editorial_conversations WHERE id = ?")
          .get(id) as { current_version_id: string | null } | undefined;
        this.db
          .prepare(
            `INSERT INTO editorial_messages (
              id, conversation_id, role, content, version_id, created_by, created_at
            ) VALUES (?, ?, 'system', ?, ?, ?, ?)`,
          )
          .run(randomUUID(), id, options.systemMessage, row?.current_version_id ?? null, options.actorId, updatedAt);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.getConversationSummary(id);
  }

  getConversation(id: string): EditorialConversationDetail {
    const row = this.db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM editorial_versions v WHERE v.conversation_id = c.id) AS version_count
         FROM editorial_conversations c WHERE c.id = ?`,
      )
      .get(id) as ConversationRow | undefined;
    if (!row || !row.current_version_id) throw new NotFoundError();

    const versions = this.listVersions(id);
    const current = versions.find((item) => item.id === row.current_version_id) ?? versions.at(-1);
    if (!current) throw new NotFoundError();

    return {
      ...mapSummary(row),
      sourcePacket: row.source_packet,
      currentVersionId: current.id,
      copy: current.copy,
      versions,
      messages: this.listMessages(id),
      pendingMemory: this.listMemoryRules("pending").filter((rule) => rule.sourceConversationId === id),
    };
  }

  listVersions(conversationId: string): EditorialVersion[] {
    const rows = this.db
      .prepare("SELECT * FROM editorial_versions WHERE conversation_id = ? ORDER BY number ASC")
      .all(conversationId) as VersionRow[];
    return rows.map(mapVersion);
  }

  getVersion(versionId: string): EditorialVersion {
    const row = this.db.prepare("SELECT * FROM editorial_versions WHERE id = ?").get(versionId) as VersionRow | undefined;
    if (!row) throw new NotFoundError();
    return mapVersion(row);
  }

  listMessages(conversationId: string): EditorialMessage[] {
    const rows = this.db
      .prepare("SELECT * FROM editorial_messages WHERE conversation_id = ? ORDER BY created_at ASC")
      .all(conversationId) as MessageRow[];
    return rows.map(mapMessage);
  }

  addVersion(input: AddVersionInput): EditorialConversationDetail {
    const current = this.getConversation(input.conversationId);
    if (input.expectedVersionId && current.currentVersionId !== input.expectedVersionId) throw new ConflictError();
    const createdAt = nowIso();
    const versionId = randomUUID();
    const nextNumber = Number(
      (
        this.db
          .prepare("SELECT IFNULL(MAX(number), 0) + 1 AS next FROM editorial_versions WHERE conversation_id = ?")
          .get(input.conversationId) as { next: number }
      ).next,
    );

    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(
          `INSERT INTO editorial_versions (
            id, conversation_id, number, copy_json, note, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          versionId,
          input.conversationId,
          nextNumber,
          JSON.stringify(input.copy),
          input.note,
          input.createdBy,
          createdAt,
        );

      this.db
        .prepare("UPDATE editorial_conversations SET current_version_id = ?, title = ?, updated_at = ? WHERE id = ?")
        .run(versionId, input.copy.title, createdAt, input.conversationId);

      if (input.userMessage?.trim()) {
        this.db
          .prepare(
            `INSERT INTO editorial_messages (
              id, conversation_id, role, content, version_id, created_by, created_at
            ) VALUES (?, ?, 'user', ?, ?, ?, ?)`,
          )
          .run(randomUUID(), input.conversationId, input.userMessage.trim(), versionId, input.createdBy, createdAt);
      }

      this.db
        .prepare(
          `INSERT INTO editorial_messages (
            id, conversation_id, role, content, version_id, created_by, created_at
          ) VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
        )
        .run(randomUUID(), input.conversationId, input.note, versionId, input.createdBy, createdAt);

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return this.getConversation(input.conversationId);
  }

  patchVersionCopy(versionId: string, copy: StoredEditorialCopy): NewsSummarizeData {
    const version = this.getVersion(versionId);
    this.db.prepare("UPDATE editorial_versions SET copy_json = ? WHERE id = ?").run(JSON.stringify(copy), versionId);
    const current = this.db
      .prepare("SELECT current_version_id FROM editorial_conversations WHERE id = ?")
      .get(version.conversationId) as { current_version_id: string } | undefined;
    if (current?.current_version_id === versionId) {
      this.db
        .prepare("UPDATE editorial_conversations SET title = ?, updated_at = ? WHERE id = ?")
        .run(copy.title, nowIso(), version.conversationId);
    }
    return this.getVersion(versionId).copy;
  }

  restoreVersion(conversationId: string, versionId: string, userId: string): EditorialConversationDetail {
    const source = this.getVersion(versionId);
    if (source.conversationId !== conversationId) throw new NotFoundError();
    const copy: StoredEditorialCopy = {
      title: source.copy.title,
      dek: source.copy.dek,
      summary: source.copy.summary,
      bullets: source.copy.bullets,
      sources: source.copy.sources,
      language: source.copy.language,
      format: source.copy.format,
      ...(source.copy.carousel ? { carousel: source.copy.carousel } : {}),
    };
    return this.addVersion({
      conversationId,
      copy,
      note: `أُعيدت النسخة ${source.number}`,
      createdBy: userId,
    });
  }

  createMemoryRule(input: {
    instruction: string;
    rationale: string;
    status?: EditorialMemoryStatus;
    createdBy: string;
    sourceConversationId?: string;
  }): EditorialMemoryRule {
    const createdAt = nowIso();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO editorial_memory_rules (
          id, instruction, rationale, status, created_by, source_conversation_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.instruction.trim(),
        input.rationale.trim(),
        input.status ?? "pending",
        input.createdBy,
        input.sourceConversationId ?? null,
        createdAt,
        createdAt,
      );
    return this.getMemoryRule(id);
  }

  getMemoryRule(id: string): EditorialMemoryRule {
    const row = this.db.prepare("SELECT * FROM editorial_memory_rules WHERE id = ?").get(id) as MemoryRow | undefined;
    if (!row) throw new NotFoundError();
    return mapMemory(row);
  }

  listMemoryRules(status?: EditorialMemoryStatus): EditorialMemoryRule[] {
    const rows = (
      status
        ? this.db.prepare("SELECT * FROM editorial_memory_rules WHERE status = ? ORDER BY updated_at DESC").all(status)
        : this.db.prepare("SELECT * FROM editorial_memory_rules ORDER BY updated_at DESC").all()
    ) as MemoryRow[];
    return rows.map(mapMemory);
  }

  updateMemoryRule(
    id: string,
    patch: { status?: EditorialMemoryStatus; instruction?: string },
  ): EditorialMemoryRule {
    const current = this.getMemoryRule(id);
    // Back to «pending» is the undo of an approval only: a rejected or disabled rule never becomes a suggestion again.
    if (patch.status === "pending" && current.status !== "approved" && current.status !== "pending") {
      throw new ValidationError();
    }
    const instruction = patch.instruction?.trim() || current.instruction;
    const status = patch.status ?? current.status;
    this.db
      .prepare("UPDATE editorial_memory_rules SET instruction = ?, status = ?, updated_at = ? WHERE id = ?")
      .run(instruction, status, nowIso(), id);
    return this.getMemoryRule(id);
  }
}
