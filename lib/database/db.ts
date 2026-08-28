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
    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      notification_id TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    );
    CREATE TABLE IF NOT EXISTS local_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
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

/**
 * Local notifications are scheduled per-device (there's nothing to sync -
 * the OS owns the schedule), so the mapping from a task/event id to its
 * scheduled notification id lives only in this local table, keyed by
 * entity type so tasks and events can't collide.
 */
export async function setScheduledNotificationId(
  entityType: 'task' | 'event',
  entityId: string,
  notificationId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO scheduled_notifications (entity_type, entity_id, notification_id)
     VALUES (?, ?, ?)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET notification_id = excluded.notification_id;`,
    [entityType, entityId, notificationId]
  );
}

export async function getScheduledNotificationId(
  entityType: 'task' | 'event',
  entityId: string
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notification_id: string }>(
    `SELECT notification_id FROM scheduled_notifications WHERE entity_type = ? AND entity_id = ?;`,
    [entityType, entityId]
  );
  return row?.notification_id ?? null;
}

export async function clearScheduledNotificationId(entityType: 'task' | 'event', entityId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM scheduled_notifications WHERE entity_type = ? AND entity_id = ?;`, [
    entityType,
    entityId,
  ]);
}

/** Small generic key/value store for device-local preferences (e.g. whether reminders are enabled). */
export async function getLocalSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM local_settings WHERE key = ?;`, [key]);
  return row?.value ?? null;
}

export async function setLocalSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO local_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value]
  );
}
