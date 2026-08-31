import { getDb } from './db';

export interface AssignmentRow {
  id: string;
  user_id: string;
  subject_id: string;
  kind: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  notes: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends AssignmentRow {
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): AssignmentRow {
  return row;
}

export async function getLocalAssignments(userId: string): Promise<AssignmentRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_assignments WHERE user_id = ? AND deleted = 0 ORDER BY due_date IS NULL, due_date ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalAssignmentIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_assignments WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasAssignmentEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_assignments WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalAssignment(
  row: AssignmentRow,
  options: { markSynced?: boolean } = {}
): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_assignments (
       id, user_id, subject_id, kind, title, due_date, due_time, notes,
       status, completed_at, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       subject_id = excluded.subject_id,
       kind = excluded.kind,
       title = excluded.title,
       due_date = excluded.due_date,
       due_time = excluded.due_time,
       notes = excluded.notes,
       status = excluded.status,
       completed_at = excluded.completed_at,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_assignments.synced_at);`,
    [
      row.id,
      row.user_id,
      row.subject_id,
      row.kind,
      row.title,
      row.due_date,
      row.due_time,
      row.notes,
      row.status,
      row.completed_at,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markAssignmentSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_assignments SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markAssignmentDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_assignments SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalAssignment(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_assignments WHERE id = ?;`, [id]);
}
