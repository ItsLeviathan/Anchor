import { getDb } from './db';

export interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  instructor: string | null;
  term: string | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends SubjectRow {
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): SubjectRow {
  return row;
}

export async function getLocalSubjects(userId: string): Promise<SubjectRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_subjects WHERE user_id = ? AND deleted = 0 ORDER BY name ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalSubjectIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_subjects WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasSubjectEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_subjects WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalSubject(row: SubjectRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_subjects (id, user_id, name, color, instructor, term, created_at, updated_at, deleted, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       color = excluded.color,
       instructor = excluded.instructor,
       term = excluded.term,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_subjects.synced_at);`,
    [row.id, row.user_id, row.name, row.color, row.instructor, row.term, row.created_at, row.updated_at, syncedAt]
  );
}

export async function markSubjectSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_subjects SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markSubjectDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_subjects SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalSubject(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_subjects WHERE id = ?;`, [id]);
}
