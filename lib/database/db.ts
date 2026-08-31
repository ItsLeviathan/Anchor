import * as SQLite from 'expo-sqlite';

/**
 * Local-first persistence.
 *
 * This module owns the single SQLite connection and the full local schema.
 * Phase 3 added the tables that make tasks/events genuinely offline-capable
 * (local_tasks, local_events, local_categories, local_calendars, and the
 * sync_queue that reconciles them with Supabase) - see lib/sync/ for the
 * engine that reads and writes them via getDb().
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
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

    -- Phase 3: local-first domain tables. Columns mirror the Supabase
    -- tables 1:1 (snake_case, same names) so mapping code can stay
    -- identical whether a row came from the network or from here. The id
    -- is the same UUID the row will use on the server too (client-generated
    -- at creation time - see lib/sync/ids.ts) - there's no separate
    -- local-id/server-id pair to reconcile, which is what keeps the sync
    -- engine simple.
    CREATE TABLE IF NOT EXISTS local_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      due_time TEXT,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      estimated_duration_minutes INTEGER,
      actual_duration_minutes INTEGER,
      recurrence_rule TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_events (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      calendar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      description TEXT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      recurrence_rule TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    -- Phase 5: expenses and bills, same local-first pattern as tasks/events.
    CREATE TABLE IF NOT EXISTS local_expenses (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT,
      notes TEXT,
      recurrence_rule TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_bills (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      payment_method TEXT,
      notes TEXT,
      recurrence_rule TEXT,
      status TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    -- Phase 5 part 2: notes, habits, shopping lists.
    CREATE TABLE IF NOT EXISTS local_notes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_habits (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      days_of_week TEXT,
      completed_dates TEXT NOT NULL DEFAULT '[]',
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_shopping_lists (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    -- Phase 6: subjects and assignments (assignment/exam/project share
    -- one table via 'kind', matching the Postgres schema). Study sessions
    -- reuse the existing local_events table - no new table for them.
    CREATE TABLE IF NOT EXISTS local_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      instructor TEXT,
      term TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS local_assignments (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      due_time TEXT,
      notes TEXT,
      status TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );
    -- Read-only local mirrors (no queue entries - see lib/sync/engine.ts)
    -- so category/calendar pickers still work while offline.
    CREATE TABLE IF NOT EXISTS local_categories (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS local_calendars (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );
    -- Every offline create/update/delete against local_tasks/local_events
    -- enqueues exactly one row here (see lib/sync/queue.ts, which coalesces
    -- repeated edits to the same entity into a single queued operation).
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
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
  entityType: 'task' | 'event' | 'document',
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
  entityType: 'task' | 'event' | 'document',
  entityId: string
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notification_id: string }>(
    `SELECT notification_id FROM scheduled_notifications WHERE entity_type = ? AND entity_id = ?;`,
    [entityType, entityId]
  );
  return row?.notification_id ?? null;
}

export async function clearScheduledNotificationId(entityType: 'task' | 'event' | 'document', entityId: string): Promise<void> {
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
