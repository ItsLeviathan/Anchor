import * as SQLite from 'expo-sqlite';

/**
 * Local-first persistence, Phase 1 scope.
 *
 * This only proves the pattern: writes land locally first and are readable
 * immediately, without waiting on the network. The full offline sync engine
 * (pending queue, conflict resolution, sync status) is built in Phase 3 —
 * this file is deliberately small so it's easy to extend then rather than
 * rewritten.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('anchor.db');
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profile_cache (
      id TEXT PRIMARY KEY NOT NULL,
      display_name TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT,
      cached_at TEXT
    );
  `);
}

export interface CachedProfile {
  id: string;
  display_name: string | null;
  is_anonymous: number;
  updated_at: string | null;
  cached_at: string | null;
}

export async function cacheProfile(profile: {
  id: string;
  displayName: string | null;
  isAnonymous: boolean;
}): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO profile_cache (id, display_name, is_anonymous, updated_at, cached_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       is_anonymous = excluded.is_anonymous,
       updated_at = excluded.updated_at,
       cached_at = excluded.cached_at;`,
    [profile.id, profile.displayName, profile.isAnonymous ? 1 : 0, now, now]
  );
}

export async function getCachedProfile(id: string): Promise<CachedProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CachedProfile>(`SELECT * FROM profile_cache WHERE id = ?;`, [id]);
  return row ?? null;
}
