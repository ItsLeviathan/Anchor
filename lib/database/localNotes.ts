import { getDb } from './db';

export interface NoteRow {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string | null;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<NoteRow, 'tags' | 'is_pinned'> {
  tags: string;
  is_pinned: number;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): NoteRow {
  return { ...row, tags: JSON.parse(row.tags), is_pinned: row.is_pinned === 1 };
}

export async function getLocalNotes(userId: string): Promise<NoteRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_notes WHERE user_id = ? AND deleted = 0 ORDER BY is_pinned DESC, updated_at DESC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalNoteIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_notes WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasNoteEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(`SELECT synced_at FROM local_notes WHERE id = ?;`, [
    id,
  ]);
  return Boolean(row?.synced_at);
}

export async function upsertLocalNote(row: NoteRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_notes (
       id, user_id, category_id, title, content, tags, is_pinned, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       category_id = excluded.category_id,
       title = excluded.title,
       content = excluded.content,
       tags = excluded.tags,
       is_pinned = excluded.is_pinned,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_notes.synced_at);`,
    [
      row.id,
      row.user_id,
      row.category_id,
      row.title,
      row.content,
      JSON.stringify(row.tags),
      row.is_pinned ? 1 : 0,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markNoteSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_notes SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markNoteDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_notes SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_notes WHERE id = ?;`, [id]);
}
