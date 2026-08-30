import { getDb } from '../database/db';
import { generateId } from './ids';

export type SyncEntityType = 'task' | 'event' | 'expense' | 'bill' | 'note' | 'habit' | 'shopping_list';
export type SyncOperation = 'upsert' | 'delete';

export interface QueueEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown> | null;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

interface QueueRow {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: string | null;
  created_at: string;
  attempts: number;
  last_error: string | null;
}

function mapRow(row: QueueRow): QueueEntry {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operation: row.operation,
    payload: row.payload ? JSON.parse(row.payload) : null,
    createdAt: row.created_at,
    attempts: row.attempts,
    lastError: row.last_error,
  };
}

/**
 * Queues an operation for later replay against Supabase, coalescing with
 * any operation already queued for the same entity. Editing an offline
 * task three times before it ever syncs produces one 'upsert' entry with
 * the latest payload, not three - and if a 'delete' comes in, it always
 * replaces whatever was queued, since the end state ("this row should not
 * exist") makes any earlier queued edit moot.
 *
 * This function only ever queues; it doesn't decide *whether* a delete
 * needs to be sent to the server at all (see `dequeueForEntity` and the
 * `synced_at` check in the task/event repos for that).
 */
export async function enqueue(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown> | null
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM sync_queue WHERE entity_type = ? AND entity_id = ? LIMIT 1;`,
    [entityType, entityId]
  );

  if (existing) {
    await db.runAsync(
      `UPDATE sync_queue SET operation = ?, payload = ?, created_at = ?, attempts = 0, last_error = NULL WHERE id = ?;`,
      [operation, payload ? JSON.stringify(payload) : null, now, existing.id]
    );
    return;
  }

  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, attempts, last_error)
     VALUES (?, ?, ?, ?, ?, ?, 0, NULL);`,
    [generateId(), entityType, entityId, operation, payload ? JSON.stringify(payload) : null, now]
  );
}

/** Removes any pending queue entry for this entity without sending anything - used when a row that never reached the server is deleted locally. */
export async function dequeueForEntity(entityType: SyncEntityType, entityId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?;`, [entityType, entityId]);
}

export async function listPending(): Promise<QueueEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<QueueRow>(`SELECT * FROM sync_queue ORDER BY created_at ASC;`);
  return rows.map(mapRow);
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM sync_queue;`);
  return row?.count ?? 0;
}

export async function removeEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [id]);
}

export async function markAttemptFailed(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?;`, [error, id]);
}

/** Entity ids with a pending queue entry - the pull step must not overwrite these with the server's (older, from its perspective) version. */
export async function getPendingEntityIds(entityType: SyncEntityType): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ entity_id: string }>(
    `SELECT entity_id FROM sync_queue WHERE entity_type = ?;`,
    [entityType]
  );
  return new Set(rows.map((row) => row.entity_id));
}
