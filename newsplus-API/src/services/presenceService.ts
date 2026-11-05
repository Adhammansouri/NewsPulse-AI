import type { PresenceActivity, PresenceData, PresenceEntry, PresenceHeartbeatData, TeamMember } from "@newsplus/shared";
import { teamColor, toMemberRef, type TeamService } from "./teamService.js";

/** A presence entry expires 45s after its last heartbeat (clients beat every 20s, so one lost beat is tolerated). */
export const PRESENCE_TTL_MS = 45_000;

export type PresenceHeartbeat = {
  itemId?: string;
  conversationId?: string;
  activity: PresenceActivity;
};

type StoredPresence = PresenceHeartbeat & {
  userId: string;
  at: number;
};

/**
 * In-memory presence store (S15 §1).
 *
 * LIMITATION — single instance only: entries live in this process's memory. With more than one API instance behind
 * a load balancer, each instance would only know the heartbeats it received itself, and `GET /presence` would show
 * a partial team. A restart forgets everyone until their next heartbeat (≤ 20s). Move this to a shared store
 * (Redis, or a table with the same TTL) before running more than one instance.
 *
 * One entry per user × conversation × story: a heartbeat for the same target refreshes it (and may switch the
 * activity); other targets keep their own entry until they expire. Expired entries are pruned on every call,
 * so memory stays bounded by the heartbeats of the last 45s.
 */
export class PresenceStore {
  private readonly entries = new Map<string, StoredPresence>();

  constructor(
    private readonly now: () => number = Date.now,
    readonly ttlMs: number = PRESENCE_TTL_MS,
  ) {}

  heartbeat(userId: string, input: PresenceHeartbeat): StoredPresence {
    const at = this.now();
    this.prune(at);
    const entry: StoredPresence = {
      userId,
      activity: input.activity,
      ...(input.itemId ? { itemId: input.itemId } : {}),
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      at,
    };
    this.entries.set(`${userId}\u0000${input.conversationId ?? ""}\u0000${input.itemId ?? ""}`, entry);
    return entry;
  }

  /** Live entries, newest heartbeat first. */
  active(): StoredPresence[] {
    this.prune(this.now());
    return [...this.entries.values()].sort((a, b) => b.at - a.at);
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      if (now - entry.at >= this.ttlMs) this.entries.delete(key);
    }
  }
}

function toEntry(stored: StoredPresence, member: TeamMember): PresenceEntry {
  return {
    user: toMemberRef(member),
    ...(stored.itemId ? { itemId: stored.itemId } : {}),
    ...(stored.conversationId ? { conversationId: stored.conversationId } : {}),
    activity: stored.activity,
    lastSeenAt: new Date(stored.at).toISOString(),
  };
}

export class PresenceService {
  constructor(
    private readonly store: PresenceStore,
    private readonly team: TeamService,
  ) {}

  private get ttlSeconds() {
    return Math.round(this.store.ttlMs / 1000);
  }

  async heartbeat(userId: string, input: PresenceHeartbeat): Promise<PresenceHeartbeatData> {
    const directory = await this.team.directory();
    const member = directory.get(userId);
    const stored = this.store.heartbeat(userId, input);
    const fallback: TeamMember = { id: userId, displayName: "", color: teamColor(userId), role: "editor" };
    return { entry: toEntry(stored, member ?? fallback), ttlSeconds: this.ttlSeconds };
  }

  /** Live entries of known team members (a token whose user no longer exists is left out). */
  async list(): Promise<PresenceData> {
    const directory = await this.team.directory();
    const entries = this.store
      .active()
      .flatMap((stored) => {
        const member = directory.get(stored.userId);
        return member ? [toEntry(stored, member)] : [];
      });
    return { entries, ttlSeconds: this.ttlSeconds };
  }
}
