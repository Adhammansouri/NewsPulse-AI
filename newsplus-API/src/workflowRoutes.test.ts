import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "./config/index.js";
import { buildApp } from "./app.js";
import { NewsAggregator } from "./services/newsAggregator.js";
import { EditorialWorkspaceStore } from "./services/editorialWorkspaceStore.js";

// S15 routes through the assembled app: team, presence, the board list and the workflow PATCH.
test("S15 team, presence and workflow routes keep auth, validation and their contracts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-workflow-routes-"));
  const storePath = join(directory, "editorial.sqlite");
  const originalEnv = { ...env };
  Object.assign(env, {
    editorialStorePath: storePath,
    pushStorePath: join(directory, "push.json"),
    openaiApiKey: "",
    authSeedIdentifier: "board-editor",
    authSeedPassword: "test-only-password",
    authSeedDisplayName: "سارة",
  });
  const start = mock.method(NewsAggregator.prototype, "start", async () => {});
  const app = await buildApp();
  app.log.level = "silent";
  try {
    for (const [method, url] of [
      ["GET", "/api/team"],
      ["GET", "/api/presence"],
      ["POST", "/api/presence/heartbeat"],
      ["PATCH", "/api/editorial/conversations/8c7d1a2e-4b6f-4c3d-9e8f-0a1b2c3d4e5f"],
    ] as const) {
      assert.equal((await app.inject({ method, url, payload: {} })).statusCode, 401, `${method} ${url}`);
    }

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { identifier: "board-editor", password: "test-only-password" },
    });
    const { token, user } = login.json().data;
    const headers = { authorization: `Bearer ${token}` };

    // GET /team
    const team = await app.inject({ url: "/api/team", headers });
    assert.equal(team.statusCode, 200);
    const [member] = team.json().data.users;
    assert.equal(member.id, user.id);
    assert.equal(member.displayName, "سارة");
    assert.match(member.color, /^#[0-9a-f]{6}$/);
    assert.equal(member.role, "editor");

    // A conversation written straight to the store the app opened (no AI in tests).
    const side = new EditorialWorkspaceStore(storePath);
    const conversation = side.createConversation({
      title: "اجتماع طارئ",
      format: "social",
      language: "ar",
      itemId: "n2",
      sourcePacket: "source",
      copy: { title: "اجتماع طارئ", dek: "", summary: "", bullets: [], sources: [], language: "ar", format: "social" },
      createdBy: user.id,
    });
    side.close();

    // POST /presence/heartbeat + GET /presence
    for (const payload of [{}, { activity: "typing" }, { activity: "writing", conversationId: "not-a-uuid" }]) {
      assert.equal((await app.inject({ method: "POST", url: "/api/presence/heartbeat", headers, payload })).statusCode, 400);
    }
    const beat = await app.inject({
      method: "POST",
      url: "/api/presence/heartbeat",
      headers,
      payload: { itemId: "n2", conversationId: conversation.id, activity: "writing" },
    });
    assert.equal(beat.statusCode, 200);
    assert.equal(beat.json().data.ttlSeconds, 45);
    const presence = await app.inject({ url: "/api/presence", headers });
    assert.equal(presence.statusCode, 200);
    const [entry] = presence.json().data.entries;
    assert.deepEqual(
      { ...entry, lastSeenAt: typeof entry.lastSeenAt },
      {
        user: { id: user.id, displayName: "سارة", color: member.color },
        itemId: "n2",
        conversationId: conversation.id,
        activity: "writing",
        lastSeenAt: "string",
      },
    );

    // GET /editorial/conversations — old callers vs board callers
    const plain = await app.inject({ url: "/api/editorial/conversations", headers });
    assert.equal(plain.statusCode, 200);
    assert.equal(plain.json().data.counts, undefined);
    const [item] = plain.json().data.items;
    assert.equal(item.status, "draft");
    assert.equal(item.assigneeId, user.id);
    assert.deepEqual(item.assignee, { id: user.id, displayName: "سارة", color: member.color });
    assert.deepEqual(item.publishedPlatforms, []);
    assert.equal(item.commentCount, 0);
    const board = await app.inject({ url: "/api/editorial/conversations?scope=mine&status=draft", headers });
    assert.equal(board.statusCode, 200);
    assert.deepEqual(board.json().data.counts, { draft: 1, review: 0, ready: 0, published: 0 });
    for (const query of ["scope=everyone", "status=archived"]) {
      assert.equal((await app.inject({ url: `/api/editorial/conversations?${query}`, headers })).statusCode, 400, query);
    }

    // PATCH /editorial/conversations/:id
    const url = `/api/editorial/conversations/${conversation.id}`;
    for (const payload of [{}, { status: "archived" }, { publishedPlatforms: ["myspace"] }]) {
      assert.equal((await app.inject({ method: "PATCH", url, headers, payload })).statusCode, 400);
    }
    assert.equal((await app.inject({ method: "PATCH", url, headers, payload: { assigneeId: "ghost" } })).statusCode, 400);
    assert.equal(
      (await app.inject({ method: "PATCH", url: "/api/editorial/conversations/not-a-uuid", headers, payload: { status: "review" } })).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "PATCH",
          url: "/api/editorial/conversations/8c7d1a2e-4b6f-4c3d-9e8f-0a1b2c3d4e5f",
          headers,
          payload: { status: "review" },
        })
      ).statusCode,
      404,
    );
    const moved = await app.inject({ method: "PATCH", url, headers, payload: { status: "review" } });
    assert.equal(moved.statusCode, 200);
    assert.equal(moved.json().data.status, "review");
    assert.equal(moved.json().data.assignee.displayName, "سارة");
    const detail = await app.inject({ url, headers });
    const last = detail.json().data.messages.at(-1);
    assert.deepEqual([last.role, last.content, last.createdBy], ["system", "نقلتها سارة لمراجعة", user.id]);
    const published = await app.inject({
      method: "PATCH",
      url,
      headers,
      payload: { status: "published", publishedPlatforms: ["x", "instagram", "x"] },
    });
    assert.deepEqual(published.json().data.publishedPlatforms, ["x", "instagram"]);

    const preflight = await app.inject({
      method: "OPTIONS",
      url,
      headers: { origin: env.corsOrigin, "access-control-request-method": "PATCH", "access-control-request-headers": "authorization,content-type" },
    });
    assert.equal(preflight.statusCode, 204);
    assert.match(String(preflight.headers["access-control-allow-methods"]), /PATCH/);
  } finally {
    await app.close();
    start.mock.restore();
    Object.assign(env, originalEnv);
    await rm(directory, { recursive: true, force: true });
  }
});
