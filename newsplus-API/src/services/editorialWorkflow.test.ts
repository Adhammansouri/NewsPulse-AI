import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, test } from "node:test";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import { moveMessage } from "./editorialWorkflow.js";

const copy = {
  title: "اجتماع طارئ لوزراء الخارجية",
  dek: "",
  summary: "ملخص",
  bullets: [],
  sources: [],
  language: "ar" as const,
  format: "social" as const,
};

const stores: EditorialWorkspaceStore[] = [];
const directories: string[] = [];

function openStore(path = ":memory:") {
  const store = new EditorialWorkspaceStore(path);
  stores.push(store);
  return store;
}

function create(store: EditorialWorkspaceStore, title: string, createdBy = "editor-1") {
  return store.createConversation({
    title,
    format: "social",
    language: "ar",
    sourcePacket: "source",
    copy: { ...copy, title },
    createdBy,
  });
}

afterEach(async () => {
  while (stores.length > 0) stores.pop()?.close();
  while (directories.length > 0) await rm(directories.pop() ?? "", { recursive: true, force: true });
});

test("migration adds the workflow columns to a pre-S15 database and back-fills existing rows", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-workflow-migration-"));
  directories.push(directory);
  const file = join(directory, "editorial.sqlite");

  // The editorial_conversations table as it was before S15, with one stored draft.
  const legacy = new DatabaseSync(file);
  legacy.exec(`
    CREATE TABLE editorial_conversations (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, format TEXT NOT NULL, language TEXT NOT NULL, item_id TEXT,
      source_label TEXT, source_packet TEXT NOT NULL, current_version_id TEXT, created_by TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE editorial_versions (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, number INTEGER NOT NULL, copy_json TEXT NOT NULL,
      note TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
  legacy
    .prepare("INSERT INTO editorial_conversations VALUES ('c-old', 'قديم', 'desk', 'ar', 'n1', NULL, 'src', 'v-old', 'editor-7', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z')")
    .run();
  legacy
    .prepare("INSERT INTO editorial_versions VALUES ('v-old', 'c-old', 1, ?, 'مسودة أولى', 'editor-7', '2026-01-01T00:00:00.000Z')")
    .run(JSON.stringify({ ...copy, title: "قديم", format: "desk" }));
  legacy.close();

  const migrated = openStore(file);
  const [row] = migrated.listConversations();
  assert.equal(row?.id, "c-old");
  assert.equal(row?.status, "draft");
  assert.equal(row?.assigneeId, "editor-7");
  assert.deepEqual(row?.publishedPlatforms, []);
  assert.equal(row?.commentCount, 0);
  assert.equal(row?.updatedAt, "2026-01-02T00:00:00.000Z");
  assert.equal(migrated.getConversation("c-old").copy.title, "قديم");
  migrated.updateWorkflow("c-old", { status: "ready" }, { actorId: "editor-7" });
  stores.pop()?.close();

  // Reopening runs the migration again without touching the data.
  const reopened = openStore(file);
  assert.equal(reopened.getConversationSummary("c-old").status, "ready");
  stores.pop()?.close();

  const inspect = new DatabaseSync(file);
  const columns = (inspect.prepare("PRAGMA table_info(editorial_conversations)").all() as Array<{ name: string }>).map((c) => c.name);
  inspect.close();
  for (const name of ["status", "assignee_id", "published_platforms", "comment_count"]) {
    assert.ok(columns.includes(name), name);
  }
});

test("a new conversation starts as a draft assigned to its creator", () => {
  const store = openStore();
  const created = create(store, "خبر جديد", "editor-2");
  assert.equal(created.status, "draft");
  assert.equal(created.assigneeId, "editor-2");
  assert.deepEqual(created.publishedPlatforms, []);
  assert.equal(created.commentCount, 0);
});

test("updateWorkflow moves the draft, logs the system line and bumps updated_at", async () => {
  const store = openStore();
  const created = create(store, "خبر");
  await new Promise((resolve) => setTimeout(resolve, 5));

  const moved = store.updateWorkflow(
    created.id,
    { status: "review" },
    { actorId: "editor-2", systemMessage: moveMessage("سارة", "review") },
  );
  assert.equal(moved.status, "review");
  assert.ok(moved.updatedAt > created.updatedAt);
  const last = store.getConversation(created.id).messages.at(-1);
  assert.equal(last?.role, "system");
  assert.equal(last?.content, "نقلتها سارة لمراجعة");
  assert.equal(last?.createdBy, "editor-2");
  assert.equal(last?.versionId, created.currentVersionId);

  const published = store.updateWorkflow(
    created.id,
    { status: "published", publishedPlatforms: ["x", "instagram"], assigneeId: "editor-3" },
    { actorId: "editor-2" },
  );
  assert.equal(published.status, "published");
  assert.deepEqual(published.publishedPlatforms, ["x", "instagram"]);
  assert.equal(published.assigneeId, "editor-3");
  assert.equal(store.getConversation(created.id).messages.filter((m) => m.role === "system").length, 1);
});

test("an update that changes nothing keeps updated_at and logs nothing", () => {
  const store = openStore();
  const created = create(store, "خبر");
  const same = store.updateWorkflow(created.id, { status: "draft" }, { actorId: "editor-1", systemMessage: "x" });
  assert.equal(same.updatedAt, created.updatedAt);
  assert.equal(store.getConversation(created.id).messages.length, 2);
});

test("updateWorkflow on an unknown conversation is not found", () => {
  const store = openStore();
  assert.throws(() => store.updateWorkflow("missing", { status: "review" }, { actorId: "editor-1" }), /Not|not/);
});

test("the unfiltered list keeps its pre-S15 search, order and page", () => {
  const store = openStore();
  for (let index = 0; index < 52; index += 1) create(store, `خبر ${index}`);
  const all = store.listConversations();
  assert.equal(all.length, 50);
  assert.deepEqual(
    all.map((item) => item.updatedAt),
    [...all.map((item) => item.updatedAt)].sort().reverse(),
  );
  assert.equal(store.listConversations("خبر 51").length, 1);
});

test("status and mine filters, and counts for the scope", () => {
  const store = openStore();
  const a = create(store, "أ", "editor-1");
  const b = create(store, "ب", "editor-2");
  const c = create(store, "ج", "editor-2");
  store.updateWorkflow(b.id, { status: "review" }, { actorId: "editor-2" });
  store.updateWorkflow(c.id, { status: "review", assigneeId: "editor-1" }, { actorId: "editor-2" });

  assert.deepEqual(store.listConversations("", { status: "review" }).map((item) => item.id).sort(), [b.id, c.id].sort());
  assert.deepEqual(
    store.listConversations("", { scope: "mine", userId: "editor-1" }).map((item) => item.id).sort(),
    [a.id, c.id].sort(),
  );
  assert.deepEqual(store.countByStatus("", {}), { draft: 1, review: 2, ready: 0, published: 0 });
  assert.deepEqual(store.countByStatus("", { scope: "mine", userId: "editor-1" }), {
    draft: 1,
    review: 1,
    ready: 0,
    published: 0,
  });
  assert.deepEqual(store.listConversations("", { scope: "team" }).length, 3);
});
