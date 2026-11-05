// S14 «تطور القصة»: snapshots of each story as the aggregator sees it grow. A row is written when a source joins a
// story or a source's headline / excerpt changes; rows older than 48 hours are pruned on every refresh. SQLite, in
// the editorial store's file (its own connection), created by an idempotent migration in one transaction.
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";

/** Snapshots are kept 48 hours (by the time the source published or changed them). */
export const STORY_UPDATES_KEEP_MS = 48 * 60 * 60 * 1000;
/** The newest snapshots read for one story. */
export const STORY_UPDATES_READ_LIMIT = 40;

export type StoryUpdate = {
  id: number;
  itemId: string;
  sourceId: string;
  /** Epoch ms the source published (or changed) this version. */
  atMs: number;
  headline: string;
  excerpt: string;
  url: string;
};

/** One source's article in a story, as the aggregator clustered it on this refresh. */
export type StorySourceObservation = {
  sourceId: string;
  headline: string;
  excerpt: string;
  url: string;
  /** Epoch ms from the feed. */
  publishedAt: number;
};

export type StoryObservation = { itemId: string; sources: StorySourceObservation[] };

type UpdateRow = {
  id: number;
  item_id: string;
  source_id: string;
  at_ms: number;
  headline: string;
  excerpt: string;
  url: string;
};

function mapRow(row: UpdateRow): StoryUpdate {
  return {
    id: Number(row.id),
    itemId: row.item_id,
    sourceId: row.source_id,
    atMs: Number(row.at_ms),
    headline: row.headline,
    excerpt: row.excerpt,
    url: row.url,
  };
}

/**
 * When a source's article becomes a new snapshot (epoch ms), or null when nothing changed:
 * - a source new to the story is recorded at its publish time, unless that is already outside the 48 hours;
 * - a changed headline or excerpt is recorded at the new publish time when the feed moved it on, otherwise now.
 */
export function snapshotAt(
  previous: Pick<StoryUpdate, "headline" | "excerpt" | "atMs"> | undefined,
  source: Pick<StorySourceObservation, "headline" | "excerpt" | "publishedAt">,
  now: number,
): number | null {
  const published = Math.min(source.publishedAt, now);
  if (!previous) return published >= now - STORY_UPDATES_KEEP_MS ? published : null;
  if (previous.headline === source.headline && previous.excerpt === source.excerpt) return null;
  return published > previous.atMs ? published : now;
}

/** One article per source (a story can cluster two from the same outlet): the newest wins. */
export function latestPerSource(sources: readonly StorySourceObservation[]): StorySourceObservation[] {
  const bySource = new Map<string, StorySourceObservation>();
  for (const source of sources) {
    const current = bySource.get(source.sourceId);
    if (!current || source.publishedAt > current.publishedAt) bySource.set(source.sourceId, source);
  }
  return [...bySource.values()];
}

export class StoryUpdatesStore {
  private readonly db: DatabaseSync;
  private readonly insertStmt: StatementSync;
  private readonly latestStmt: StatementSync;
  private readonly listStmt: StatementSync;
  private readonly pruneStmt: StatementSync;

  constructor(filePath: string) {
    if (filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }
    this.db = new DatabaseSync(filePath);
    this.db.exec("PRAGMA busy_timeout = 5000;");
    if (filePath !== ":memory:") {
      this.db.exec("PRAGMA journal_mode = WAL;");
    }
    this.migrate();
    this.insertStmt = this.db.prepare(
      "INSERT INTO story_updates (item_id, source_id, at_ms, headline, excerpt, url) VALUES (?, ?, ?, ?, ?, ?)",
    );
    this.latestStmt = this.db.prepare(
      "SELECT * FROM story_updates WHERE item_id = ? AND source_id = ? ORDER BY id DESC LIMIT 1",
    );
    this.listStmt = this.db.prepare(
      "SELECT * FROM story_updates WHERE item_id = ? AND at_ms >= ? ORDER BY at_ms DESC, id DESC LIMIT ?",
    );
    this.pruneStmt = this.db.prepare("DELETE FROM story_updates WHERE at_ms < ?");
  }

  close() {
    this.db.close();
  }

  /** Idempotent: the table and its indexes, in one transaction. */
  private migrate() {
    this.db.exec("BEGIN");
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS story_updates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL,
          source_id TEXT NOT NULL,
          at_ms INTEGER NOT NULL,
          headline TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          url TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS story_updates_item_source_idx ON story_updates (item_id, source_id, id);
        CREATE INDEX IF NOT EXISTS story_updates_item_at_idx ON story_updates (item_id, at_ms);
        CREATE INDEX IF NOT EXISTS story_updates_at_idx ON story_updates (at_ms);
      `);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  /**
   * One aggregator refresh: prunes what is older than 48 hours, then writes a snapshot for every source that joined
   * a story or changed its headline / excerpt. Returns how many snapshots were written.
   */
  record(stories: readonly StoryObservation[], now = Date.now()): number {
    let written = 0;
    this.db.exec("BEGIN");
    try {
      this.pruneStmt.run(now - STORY_UPDATES_KEEP_MS);
      for (const story of stories) {
        for (const source of latestPerSource(story.sources)) {
          const row = this.latestStmt.get(story.itemId, source.sourceId) as UpdateRow | undefined;
          const at = snapshotAt(row ? mapRow(row) : undefined, source, now);
          if (at === null) continue;
          this.insertStmt.run(story.itemId, source.sourceId, at, source.headline, source.excerpt, source.url);
          written += 1;
        }
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return written;
  }

  /** The story's snapshots within the 48 hours, oldest first (the newest `limit` of them). */
  list(itemId: string, now = Date.now(), limit = STORY_UPDATES_READ_LIMIT): StoryUpdate[] {
    const rows = this.listStmt.all(itemId, now - STORY_UPDATES_KEEP_MS, limit) as UpdateRow[];
    return rows.map(mapRow).reverse();
  }
}
