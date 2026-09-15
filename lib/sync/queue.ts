import { getDb } from '../database/db';
import { generateId } from './ids';

export type SyncEntityType =
  | 'task'
  | 'event'
  | 'expense'
  | 'bill'
  | 'note'
  | 'habit'
  | 'shopping_list'
  | 'subject'
  | 'assignment';
export type SyncOperation = 'upsert' | 'delete';

/**
 * Bounded-retry policy (spec: no retry mechanism may retry indefinitely).
 * After MAX_SYNC_ATTEMPTS failures - or immediately on a non-retryable
 * error such as auth/authorization/validation, see isRetryableSyncError in
 * engine.ts - an entry is marked `failed` and flushQueue stops picking it
 * up (see listPending). Between attempts it waits out an exponential
 * backoff with jitter (BASE_BACKOFF_MS * 2^attempts, capped at
 * MAX_BACKOFF_MS) instead of being retried on every single trigger
 * (foreground, reconnect, or any unrelated new mutation).
 */
export const MAX_SYNC_ATTEMPTS = 6;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 30 * 60_000;

export interface QueueEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown> | null;
  createdAt: string;
  attempts: number;
  lastError: string | null;
  failed: boolean;
  nextAttemptAt: string | null;
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
  failed: number;
  next_attempt_at: string | null;
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
    failed: row.failed === 1,
    nextAttemptAt: row.next_attempt_at,
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
    // A fresh edit (including one that fixes whatever made a previous
    // payload permanently fail, e.g. a validation error) always gets a
    // clean retry budget - reset attempts/failed/backoff, don't inherit the
    // old payload's history.
    await db.runAsync(
      `UPDATE sync_queue SET operation = ?, payload = ?, created_at = ?, attempts = 0, last_error = NULL, failed = 0, next_attempt_at = NULL WHERE id = ?;`,
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

/**
 * Entries the engine should actually attempt this pass: not yet given up on
 * (`failed`), and not sitting inside its backoff window. Excludes
 * permanently-failed entries so a poisoned payload (bad validation, a stale
 * auth token) isn't resent to the server on every single foreground/
 * reconnect/mutation trigger forever.
 */
export async function listPending(): Promise<QueueEntry[]> {
  const db = await getDb();
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<QueueRow>(
    `SELECT * FROM sync_queue WHERE failed = 0 AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at ASC;`,
    [now]
  );
  return rows.map(mapRow);
}

/** Total unsynced rows (including ones waiting out backoff or permanently failed) - used for the "waiting to sync" UI count. */
export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM sync_queue;`);
  return row?.count ?? 0;
}

/** Rows the engine has permanently given up on - needs a human/user fix (edit the record again, or a future "sync issues" UI), not further automatic retries. */
export async function countFailed(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM sync_queue WHERE failed = 1;`);
  return row?.count ?? 0;
}

export async function removeEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [id]);
}

/**
 * Records a failed push attempt and decides whether it's worth trying
 * again. `retryable = false` (auth/authorization/validation errors - see
 * isRetryableSyncError in engine.ts) gives up immediately; otherwise the
 * entry gets exponential backoff with jitter, and gives up once
 * MAX_SYNC_ATTEMPTS is reached. Either way, once failed, listPending stops
 * returning it - flushQueue will never spin on it again automatically.
 */
export async function markAttemptFailed(id: string, error: string, retryable: boolean = true): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ attempts: number }>(`SELECT attempts FROM sync_queue WHERE id = ?;`, [id]);
  const attempts = (row?.attempts ?? 0) + 1;

  if (!retryable || attempts >= MAX_SYNC_ATTEMPTS) {
    await db.runAsync(
      `UPDATE sync_queue SET attempts = ?, last_error = ?, failed = 1, next_attempt_at = NULL WHERE id = ?;`,
      [attempts, error, id]
    );
    return;
  }

  const backoffMs = Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
  const jitteredMs = backoffMs + Math.floor(Math.random() * backoffMs * 0.2);
  const nextAttemptAt = new Date(Date.now() + jitteredMs).toISOString();

  await db.runAsync(`UPDATE sync_queue SET attempts = ?, last_error = ?, next_attempt_at = ? WHERE id = ?;`, [
    attempts,
    error,
    nextAttemptAt,
    id,
  ]);
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
