import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AppError } from "../utils/errors.js";
import { EditorialWorkflowService } from "./editorialWorkflowService.js";
import { EditorialWorkspaceStore } from "./editorialWorkspaceStore.js";
import { TeamService, teamColor } from "./teamService.js";

const team = new TeamService({
  listUsers: async () => [
    { id: "u-1", identifier: "sara", displayName: "سارة", role: "editor" },
    { id: "u-2", identifier: "ahmed", displayName: "أحمد", role: "editor" },
  ],
});

const stores: EditorialWorkspaceStore[] = [];

function setup() {
  const workspace = new EditorialWorkspaceStore(":memory:");
  stores.push(workspace);
  const create = (title: string, createdBy: string) =>
    workspace.createConversation({
      title,
      format: "desk",
      language: "ar",
      sourcePacket: "source",
      copy: { title, dek: "", summary: "", bullets: [], sources: [], language: "ar", format: "desk" },
      createdBy,
    });
  return { workspace, create, service: new EditorialWorkflowService({ workspace, team }) };
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

test("the list without scope or status is the old list plus the new fields and the assignee, without counts", async () => {
  const { service, create, workspace } = setup();
  create("أ", "u-1");
  create("ب", "ghost");
  const data = await service.list({}, "u-1");
  assert.equal(data.counts, undefined);
  assert.deepEqual(
    data.items.map((item) => item.id),
    workspace.listConversations().map((item) => item.id),
  );
  const mine = data.items.find((item) => item.createdBy === "u-1");
  assert.deepEqual(mine?.assignee, { id: "u-1", displayName: "سارة", color: teamColor("u-1") });
  assert.equal(mine?.status, "draft");
  // An assignee who is not a team member has no `assignee` object, but keeps `assigneeId`.
  const unknown = data.items.find((item) => item.createdBy === "ghost");
  assert.equal(unknown?.assignee, undefined);
  assert.equal(unknown?.assigneeId, "ghost");
});

test("scope and status filter the items; counts cover the whole scope", async () => {
  const { service, create } = setup();
  const a = create("أ", "u-1");
  create("ب", "u-2");
  await service.update(a.id, { status: "review" }, "u-1");

  const review = await service.list({ scope: "team", status: "review" }, "u-2");
  assert.deepEqual(review.items.map((item) => item.id), [a.id]);
  assert.deepEqual(review.counts, { draft: 1, review: 1, ready: 0, published: 0 });

  const mine = await service.list({ scope: "mine" }, "u-2");
  assert.deepEqual(mine.items.map((item) => item.title), ["ب"]);
  assert.deepEqual(mine.counts, { draft: 1, review: 0, ready: 0, published: 0 });
});

test("update logs «نقلتها {name} ل{column}» on a column change and returns the assignee", async () => {
  const { service, create, workspace } = setup();
  const a = create("أ", "u-2");
  const moved = await service.update(a.id, { status: "review", assigneeId: "u-1" }, "u-1");
  assert.equal(moved.status, "review");
  assert.equal(moved.assignee?.displayName, "سارة");
  assert.equal(workspace.getConversation(a.id).messages.at(-1)?.content, "نقلتها سارة لمراجعة");

  await service.update(a.id, { publishedPlatforms: ["x"] }, "u-1");
  assert.equal(workspace.getConversation(a.id).messages.filter((m) => m.role === "system").length, 1);
});

test("update rejects an assignee outside the team and unknown conversations", async () => {
  const { service, create } = setup();
  const a = create("أ", "u-1");
  await assert.rejects(service.update(a.id, { assigneeId: "ghost" }, "u-1"), (error: unknown) => error instanceof AppError && error.statusCode === 400);
  await assert.rejects(
    service.update("8c7d1a2e-4b6f-4c3d-9e8f-0a1b2c3d4e5f", { status: "ready" }, "u-1"),
    (error: unknown) => error instanceof AppError && error.statusCode === 404,
  );
});
