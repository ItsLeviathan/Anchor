import { getDb } from './db';

export interface HabitRow {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  frequency: string;
  days_of_week: number[] | null;
  completed_dates: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<HabitRow, 'days_of_week' | 'completed_dates' | 'archived'> {
  days_of_week: string | null;
  completed_dates: string;
  archived: number;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): HabitRow {
  return {
    ...row,
    days_of_week: row.days_of_week ? JSON.parse(row.days_of_week) : null,
    completed_dates: JSON.parse(row.completed_dates),
    archived: row.archived === 1,
  };
}

export async function getLocalHabits(userId: string): Promise<HabitRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_habits WHERE user_id = ? AND deleted = 0 AND archived = 0 ORDER BY created_at ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalHabitIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_habits WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasHabitEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_habits WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalHabit(row: HabitRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_habits (
       id, user_id, category_id, name, frequency, days_of_week, completed_dates,
       archived, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       category_id = excluded.category_id,
       name = excluded.name,
       frequency = excluded.frequency,
       days_of_week = excluded.days_of_week,
       completed_dates = excluded.completed_dates,
       archived = excluded.archived,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_habits.synced_at);`,
    [
      row.id,
      row.user_id,
      row.category_id,
      row.name,
      row.frequency,
      row.days_of_week ? JSON.stringify(row.days_of_week) : null,
      JSON.stringify(row.completed_dates),
      row.archived ? 1 : 0,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markHabitSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_habits SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markHabitDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_habits SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_habits WHERE id = ?;`, [id]);
}
