import assert from "node:assert/strict";
import { test } from "node:test";
import { PRESENCE_TTL_MS, PresenceService, PresenceStore } from "./presenceService.js";
import { TeamService, teamColor } from "./teamService.js";

const team = new TeamService({
  listUsers: async () => [
    { id: "u-1", identifier: "sara", displayName: "سارة", role: "editor" },
    { id: "u-2", identifier: "ahmed", displayName: "أحمد", role: "editor" },
  ],
});

function clock(start = Date.parse("2026-11-04T10:00:00.000Z")) {
  let now = start;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

test("entries expire 45 seconds after their last heartbeat", async () => {
  const time = clock();
  const service = new PresenceService(new PresenceStore(time.now), team);
  await service.heartbeat("u-1", { conversationId: "c-1", activity: "writing" });
  time.advance(PRESENCE_TTL_MS - 1);
  assert.equal((await service.list()).entries.length, 1);
  time.advance(1);
  assert.deepEqual((await service.list()).entries, []);
  assert.equal((await service.list()).ttlSeconds, 45);
});

test("a heartbeat for the same target refreshes its entry and can switch the activity", async () => {
  const time = clock();
  const service = new PresenceService(new PresenceStore(time.now), team);
  await service.heartbeat("u-1", { itemId: "n1", conversationId: "c-1", activity: "viewing" });
  time.advance(30_000);
  await service.heartbeat("u-1", { itemId: "n1", conversationId: "c-1", activity: "writing" });
  time.advance(30_000);
  const { entries } = await service.list();
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    user: { id: "u-1", displayName: "سارة", color: teamColor("u-1") },
    itemId: "n1",
    conversationId: "c-1",
    activity: "writing",
    lastSeenAt: new Date(Date.parse("2026-11-04T10:00:30.000Z")).toISOString(),
  });
});

test("separate targets and users keep separate entries, newest first; unknown users are left out", async () => {
  const time = clock();
  const service = new PresenceService(new PresenceStore(time.now), team);
  await service.heartbeat("u-1", { itemId: "n1", activity: "viewing" });
  time.advance(1_000);
  await service.heartbeat("u-1", { conversationId: "c-2", activity: "writing" });
  time.advance(1_000);
  const own = await service.heartbeat("u-2", { activity: "viewing" });
  await service.heartbeat("ghost", { itemId: "n1", activity: "writing" });

  assert.equal(own.entry.user.displayName, "أحمد");
  assert.equal(own.ttlSeconds, 45);
  const { entries } = await service.list();
  assert.deepEqual(
    entries.map((entry) => [entry.user.id, entry.conversationId ?? entry.itemId ?? null]),
    [
      ["u-2", null],
      ["u-1", "c-2"],
      ["u-1", "n1"],
    ],
  );
});
