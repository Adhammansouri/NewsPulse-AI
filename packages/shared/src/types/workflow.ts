import type { UserRole } from "./auth.js";

/** S15 «سير العمل»: where a draft (editorial conversation) sits on the board. */
export const EDITORIAL_WORKFLOW_STATUSES = ["draft", "review", "ready", "published"] as const;
export type EditorialWorkflowStatus = (typeof EDITORIAL_WORKFLOW_STATUSES)[number];

/** Platforms a draft can be marked as published on (the S12 platform set). */
export const EDITORIAL_PUBLISH_PLATFORMS = ["x", "instagram", "facebook", "telegram", "tiktok"] as const;
export type EditorialPublishPlatform = (typeof EDITORIAL_PUBLISH_PLATFORMS)[number];

/** `GET /editorial/conversations?scope=` — the whole team, or the caller's own drafts (creator or assignee). */
export type EditorialConversationScope = "team" | "mine";

/** A team member as other payloads reference them (assignee, presence user). `color` is deterministic per user. */
export type TeamMemberRef = {
  id: string;
  displayName: string;
  color: string;
};

export type TeamMember = TeamMemberRef & {
  role: UserRole;
};

/** `GET /team`. */
export type TeamData = {
  users: TeamMember[];
};

export type PresenceActivity = "writing" | "viewing";

/** `POST /presence/heartbeat` — sent every 20s while a draft or story is open. */
export type PresenceHeartbeatRequest = {
  itemId?: string;
  conversationId?: string;
  activity: PresenceActivity;
};

export type PresenceEntry = {
  user: TeamMemberRef;
  itemId?: string;
  conversationId?: string;
  activity: PresenceActivity;
  /** Time of the last heartbeat. The entry expires `ttlSeconds` after it. */
  lastSeenAt: string;
};

/** `GET /presence`: the entries whose last heartbeat is younger than `ttlSeconds`, newest first. */
export type PresenceData = {
  entries: PresenceEntry[];
  ttlSeconds: number;
};

export type PresenceHeartbeatData = {
  entry: PresenceEntry;
  ttlSeconds: number;
};
