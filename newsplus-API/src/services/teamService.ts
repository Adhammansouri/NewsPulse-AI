import type { AuthUser, TeamMember, TeamMemberRef } from "@newsplus/shared";

/** The avatar colours of the S15 boards (NewBoard / MobNewQueue `ava` backgrounds). */
export const TEAM_COLORS = ["#0a7f71", "#1d4ed8", "#a16207"] as const;

/**
 * A user's avatar colour: FNV-1a of the user id, modulo the palette. Pure function of the id, so the same person
 * keeps the same colour in every payload (team, assignee, presence), on every instance and across restarts.
 */
export function teamColor(userId: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return TEAM_COLORS[hash % TEAM_COLORS.length] ?? TEAM_COLORS[0];
}

export function toTeamMember(user: AuthUser): TeamMember {
  return {
    id: user.id,
    displayName: user.displayName || user.identifier,
    color: teamColor(user.id),
    role: user.role,
  };
}

export function toMemberRef(member: TeamMember): TeamMemberRef {
  return { id: member.id, displayName: member.displayName, color: member.color };
}

export type TeamUserSource = {
  listUsers(): Promise<AuthUser[]>;
};

/** The newsroom team: every account, with its display name and deterministic colour. */
export class TeamService {
  constructor(private readonly users: TeamUserSource) {}

  /** `GET /team`: sorted by display name, then id, so the order is stable. */
  async list(): Promise<TeamMember[]> {
    const members = (await this.users.listUsers()).map(toTeamMember);
    return members.sort((a, b) => a.displayName.localeCompare(b.displayName, "ar") || a.id.localeCompare(b.id));
  }

  /** Members by id, for resolving assignees, actors and presence users. */
  async directory(): Promise<Map<string, TeamMember>> {
    return new Map((await this.list()).map((member) => [member.id, member]));
  }
}
