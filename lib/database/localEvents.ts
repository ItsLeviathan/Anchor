import { getDb } from './db';

export interface EventRow {
  id: string;
  user_id: string;
  calendar_id: string;
  title: string;
  location: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  recurrence_rule: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<EventRow, 'recurrence_rule' | 'all_day'> {
  recurrence_rule: string | null;
  all_day: number;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): EventRow {
  return {
    ...row,
    all_day: row.all_day === 1,
    recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null,
  };
}

export async function getLocalEvents(userId: string): Promise<EventRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_events WHERE user_id = ? AND deleted = 0 ORDER BY start_at ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalEvent(id: string): Promise<EventRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RawRow>(`SELECT * FROM local_events WHERE id = ?;`, [id]);
  return row ? fromRaw(row) : null;
}

export async function hasEventEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_events WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalEvent(row: EventRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_events (
       id, user_id, calendar_id, title, location, description, start_at, end_at,
       all_day, recurrence_rule, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       calendar_id = excluded.calendar_id,
       title = excluded.title,
       location = excluded.location,
       description = excluded.description,
       start_at = excluded.start_at,
       end_at = excluded.end_at,
       all_day = excluded.all_day,
       recurrence_rule = excluded.recurrence_rule,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_events.synced_at);`,
    [
      row.id,
      row.user_id,
      row.calendar_id,
      row.title,
      row.location,
      row.description,
      row.start_at,
      row.end_at,
      row.all_day ? 1 : 0,
      row.recurrence_rule ? JSON.stringify(row.recurrence_rule) : null,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markEventSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_events SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markEventDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_events SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function getLocalEventIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_events WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function removeLocalEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_events WHERE id = ?;`, [id]);
}
