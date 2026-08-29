import { getDb } from './db';

/**
 * Shape shared with the `tasks` table on Supabase - this is exactly what
 * gets sent as the sync_queue payload and, later, upserted remotely. Local
 * bookkeeping columns (`deleted`, `synced_at`) deliberately live outside
 * this type since Supabase's `tasks` table has no such columns.
 */
export interface TaskRow {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  status: string;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  recurrence_rule: Record<string, unknown> | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<TaskRow, 'recurrence_rule'> {
  recurrence_rule: string | null;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): TaskRow {
  return { ...row, recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null };
}

export async function getLocalTasks(userId: string): Promise<TaskRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_tasks WHERE user_id = ? AND deleted = 0 ORDER BY due_date IS NULL, due_date ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalTask(id: string): Promise<TaskRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RawRow>(`SELECT * FROM local_tasks WHERE id = ?;`, [id]);
  return row ? fromRaw(row) : null;
}

/** Has this row ever reached the server? (Not "is it currently in sync" - see lib/sync/queue.ts for that.) */
export async function hasTaskEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_tasks WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalTask(row: TaskRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_tasks (
       id, user_id, category_id, title, description, due_date, due_time,
       priority, status, estimated_duration_minutes, actual_duration_minutes,
       recurrence_rule, completed_at, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       category_id = excluded.category_id,
       title = excluded.title,
       description = excluded.description,
       due_date = excluded.due_date,
       due_time = excluded.due_time,
       priority = excluded.priority,
       status = excluded.status,
       estimated_duration_minutes = excluded.estimated_duration_minutes,
       actual_duration_minutes = excluded.actual_duration_minutes,
       recurrence_rule = excluded.recurrence_rule,
       completed_at = excluded.completed_at,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_tasks.synced_at);`,
    [
      row.id,
      row.user_id,
      row.category_id,
      row.title,
      row.description,
      row.due_date,
      row.due_time,
      row.priority,
      row.status,
      row.estimated_duration_minutes,
      row.actual_duration_minutes,
      row.recurrence_rule ? JSON.stringify(row.recurrence_rule) : null,
      row.completed_at,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markTaskSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_tasks SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

/** Soft delete: hides the row from getLocalTasks immediately without losing it before the sync engine has had a chance to tell the server. */
export async function markTaskDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_tasks SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function getLocalTaskIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_tasks WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

/** Hard delete from the local table - used once the server delete has actually gone through, or immediately for a row that never synced. */
export async function removeLocalTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_tasks WHERE id = ?;`, [id]);
}
