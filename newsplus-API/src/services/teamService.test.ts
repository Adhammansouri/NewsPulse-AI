import assert from "node:assert/strict";
import { test } from "node:test";
import type { AuthUser } from "@newsplus/shared";
import { TEAM_COLORS, TeamService, teamColor } from "./teamService.js";

const users: AuthUser[] = [
  { id: "u-2", identifier: "mona", displayName: "منى", role: "editor" },
  { id: "u-1", identifier: "sara", displayName: "سارة", role: "admin" },
  { id: "u-3", identifier: "ahmed", displayName: "", role: "editor" },
];

test("team colours are deterministic per user id and come from the board palette", () => {
  for (const id of ["u-1", "u-2", "9a1b3c4d-1234-5abc-a123-0123456789ab"]) {
    assert.equal(teamColor(id), teamColor(id));
    assert.ok((TEAM_COLORS as readonly string[]).includes(teamColor(id)));
  }
  const spread = new Set(Array.from({ length: 30 }, (_, index) => teamColor(`user-${index}`)));
  assert.equal(spread.size, TEAM_COLORS.length);
});

test("GET /team members are sorted by name (Arabic collation) with role and colour; a blank name falls back to the identifier", async () => {
  const team = new TeamService({ listUsers: async () => users });
  const members = await team.list();
  assert.deepEqual(
    members.map((member) => member.displayName),
    ["سارة", "منى", "ahmed"],
  );
  const sara = members.find((member) => member.id === "u-1");
  assert.deepEqual(sara, { id: "u-1", displayName: "سارة", color: teamColor("u-1"), role: "admin" });
  assert.equal((await team.directory()).get("u-2")?.displayName, "منى");
});
