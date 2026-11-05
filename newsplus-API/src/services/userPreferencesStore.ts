// S16 onboarding: each editor's choices — the platforms they publish on, the sources they follow, their hook style —
// and when they finished (or skipped) onboarding. SQLite, in the editorial store's file (its own connection, as
// S14's StoryUpdatesStore), created by an idempotent migration in one transaction.
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { EDITORIAL_PUBLISH_PLATFORMS, HOOK_STYLES, type EditorialPublishPlatform, type HookStyle, type UserPreferences } from "@newsplus/shared";

type PreferencesRow = {
  user_id: string;
  platforms: string;
  sources: string;
  hook_style: string | null;
  onboarded_at: string | null;
  updated_at: string;
};

function isPlatform(value: unknown): value is EditorialPublishPlatform {
  return typeof value === "string" && (EDITORIAL_PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

function isHookStyle(value: unknown): value is HookStyle {
  return typeof value === "string" && (HOOK_STYLES as readonly string[]).includes(value);
}

function parseList(raw: string): unknown[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** Nothing chosen yet, onboarding not done. */
export function emptyPreferences(): UserPreferences {
  return { platforms: [], sources: [] };
}

function mapRow(row: PreferencesRow): UserPreferences {
  const hookStyle = isHookStyle(row.hook_style) ? row.hook_style : undefined;
  return {
    platforms: parseList(row.platforms).filter(isPlatform),
    sources: parseList(row.sources).filter((id): id is string => typeof id === "string" && id.length > 0),
    ...(hookStyle ? { hookStyle } : {}),
    ...(row.onboarded_at ? { onboardedAt: row.onboarded_at } : {}),
  };
}

export class UserPreferencesStore {
  private readonly db: DatabaseSync;
  private readonly getStmt: StatementSync;
  private readonly upsertStmt: StatementSync;

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
    this.getStmt = this.db.prepare("SELECT * FROM user_preferences WHERE user_id = ?");
    this.upsertStmt = this.db.prepare(
      `INSERT INTO user_preferences (user_id, platforms, sources, hook_style, onboarded_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         platforms = excluded.platforms,
         sources = excluded.sources,
         hook_style = excluded.hook_style,
         onboarded_at = excluded.onboarded_at,
         updated_at = excluded.updated_at`,
    );
  }

  close() {
    this.db.close();
  }

  /** Idempotent: the table, in one transaction. */
  private migrate() {
    this.db.exec("BEGIN");
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id TEXT PRIMARY KEY,
          platforms TEXT NOT NULL DEFAULT '[]',
          sources TEXT NOT NULL DEFAULT '[]',
          hook_style TEXT,
          onboarded_at TEXT,
          updated_at TEXT NOT NULL
        );
      `);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  /** The user's preferences, or the empty ones when they never saved any. */
  get(userId: string): UserPreferences {
    const row = this.getStmt.get(userId) as PreferencesRow | undefined;
    return row ? mapRow(row) : emptyPreferences();
  }

  /** Replaces the user's row and returns what was stored. */
  save(userId: string, preferences: UserPreferences, now = new Date()): UserPreferences {
    this.upsertStmt.run(
      userId,
      JSON.stringify(preferences.platforms),
      JSON.stringify(preferences.sources),
      preferences.hookStyle ?? null,
      preferences.onboardedAt ?? null,
      now.toISOString(),
    );
    return this.get(userId);
  }
}
