import { replaceLocalCategories } from '../database/localCategories';
import { replaceLocalCalendars } from '../database/localCalendars';
import {
  getLocalTaskIds,
  hasTaskEverSynced,
  markTaskDeletedLocally,
  markTaskSynced,
  removeLocalTask,
  upsertLocalTask,
  type TaskRow,
} from '../database/localTasks';
import {
  getLocalEventIds,
  hasEventEverSynced,
  markEventDeletedLocally,
  markEventSynced,
  removeLocalEvent,
  upsertLocalEvent,
  type EventRow,
} from '../database/localEvents';
import { useSyncStore } from '../../store/useSyncStore';
import {
  countPending,
  dequeueForEntity,
  enqueue,
  getPendingEntityIds,
  listPending,
  markAttemptFailed,
  removeEntry,
  type SyncEntityType,
} from './queue';
import { fetchRemoteCalendars } from './remoteCalendars';
import { fetchRemoteCategories } from './remoteCategories';
import { deleteRemoteEvent, fetchRemoteEvents, upsertRemoteEvent } from './remoteEvents';
import { deleteRemoteTask, fetchRemoteTasks, upsertRemoteTask } from './remoteTasks';

/**
 * Conflict resolution rule (spec section 38 requires one to be defined):
 * Anchor is single-user, so the only way two writes to the same row can
 * race is the same account editing from two devices while one was
 * offline. Every push is an unconditional upsert of the queued payload -
 * whichever device's change reaches the server last wins outright. There
 * is no field-level merge. This is a deliberate simplification: building
 * true conflict-free merging only pays for itself once concurrent
 * multi-device editing is common enough to cause real data loss
 * complaints, which isn't the situation Anchor is in yet.
 */

export async function refreshPendingCount(): Promise<void> {
  const count = await countPending();
  useSyncStore.getState().setPendingCount(count);
}

/** Queues a create/update for later replay, immediately reflecting the new count in the sync status UI. */
export async function enqueueUpsert(entityType: SyncEntityType, entityId: string, payload: Record<string, unknown>) {
  await enqueue(entityType, entityId, 'upsert', payload);
  await refreshPendingCount();
  triggerFlush();
}

/**
 * Owns the full delete decision so callers (the task/event repos) don't
 * have to know about sync state at all:
 *  - never reached the server -> just remove it locally, nothing to tell
 *    the server, no orphaned soft-deleted row left behind
 *  - already synced -> soft-delete locally (stays hidden immediately) and
 *    queue the remote delete for the engine to replay
 */
export async function enqueueDelete(entityType: SyncEntityType, entityId: string): Promise<void> {
  const everSynced = entityType === 'task' ? await hasTaskEverSynced(entityId) : await hasEventEverSynced(entityId);

  if (!everSynced) {
    await dequeueForEntity(entityType, entityId);
    if (entityType === 'task') await removeLocalTask(entityId);
    else await removeLocalEvent(entityId);
  } else {
    if (entityType === 'task') await markTaskDeletedLocally(entityId);
    else await markEventDeletedLocally(entityId);
    await enqueue(entityType, entityId, 'delete', null);
  }

  await refreshPendingCount();
  triggerFlush();
}

let isFlushing = false;

/** Fire-and-forget trigger used by mutations - callers don't await this. */
export function triggerFlush(): void {
  if (!useSyncStore.getState().isOnline) return;
  flushQueue().catch((err) => console.error('Sync flush failed', err));
}

/** Pushes every queued operation to Supabase, one at a time, in the order they were queued. A failure on one entry doesn't block the rest. */
export async function flushQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;
  useSyncStore.getState().setSyncing(true);

  try {
    const entries = await listPending();

    for (const entry of entries) {
      try {
        if (entry.operation === 'upsert' && entry.payload) {
          if (entry.entityType === 'task') {
            await upsertRemoteTask(entry.payload as unknown as TaskRow);
            await markTaskSynced(entry.entityId);
          } else {
            await upsertRemoteEvent(entry.payload as unknown as EventRow);
            await markEventSynced(entry.entityId);
          }
        } else if (entry.operation === 'delete') {
          if (entry.entityType === 'task') {
            await deleteRemoteTask(entry.entityId);
            await removeLocalTask(entry.entityId);
          } else {
            await deleteRemoteEvent(entry.entityId);
            await removeLocalEvent(entry.entityId);
          }
        }

        await removeEntry(entry.id);
      } catch (err) {
        await markAttemptFailed(entry.id, err instanceof Error ? err.message : String(err));
        // Keep going - one bad entry (e.g. a transient network blip mid-flush) shouldn't stall the rest of the queue.
      }
    }
  } finally {
    await refreshPendingCount();
    useSyncStore.getState().setSyncing(false);
    isFlushing = false;
  }
}

/**
 * Merges server state into the local tables. Any row with a pending queue
 * entry is left untouched - the local edit takes precedence until it's
 * actually pushed, rather than the pull silently overwriting it. Rows that
 * exist locally but no longer exist on the server (and aren't pending) are
 * removed, so deletions made elsewhere - the Supabase dashboard, a future
 * second device - eventually show up here too.
 */
export async function pullRemoteChanges(userId: string): Promise<void> {
  const [remoteTasks, remoteEvents, remoteCategories, remoteCalendars] = await Promise.all([
    fetchRemoteTasks(),
    fetchRemoteEvents(),
    fetchRemoteCategories(),
    fetchRemoteCalendars(),
  ]);

  const [pendingTaskIds, pendingEventIds, localTaskIds, localEventIds] = await Promise.all([
    getPendingEntityIds('task'),
    getPendingEntityIds('event'),
    getLocalTaskIds(userId),
    getLocalEventIds(userId),
  ]);

  const remoteTaskIds = new Set(remoteTasks.map((row) => row.id));
  const remoteEventIds = new Set(remoteEvents.map((row) => row.id));

  for (const row of remoteTasks) {
    if (pendingTaskIds.has(row.id)) continue;
    await upsertLocalTask(row, { markSynced: true });
  }
  for (const row of remoteEvents) {
    if (pendingEventIds.has(row.id)) continue;
    await upsertLocalEvent(row, { markSynced: true });
  }

  // Prune local rows that no longer exist remotely and aren't awaiting sync themselves.
  for (const id of localTaskIds) {
    if (!remoteTaskIds.has(id) && !pendingTaskIds.has(id)) await removeLocalTask(id);
  }
  for (const id of localEventIds) {
    if (!remoteEventIds.has(id) && !pendingEventIds.has(id)) await removeLocalEvent(id);
  }

  await replaceLocalCategories(userId, remoteCategories);
  await replaceLocalCalendars(userId, remoteCalendars);
}

/** Called once when a session becomes available (app start / sign-in). */
export async function syncOnAppStart(userId: string): Promise<void> {
  useSyncStore.getState().setSyncing(true);
  try {
    await pullRemoteChanges(userId);
    await flushQueue();
  } catch (err) {
    console.error('Initial sync failed', err);
  } finally {
    await refreshPendingCount();
    useSyncStore.getState().setSyncing(false);
  }
}

/** Called when connectivity is restored - push first so local edits aren't clobbered by the pull that follows. */
export async function syncOnReconnect(userId: string): Promise<void> {
  useSyncStore.getState().setSyncing(true);
  try {
    await flushQueue();
    await pullRemoteChanges(userId);
  } catch (err) {
    console.error('Reconnect sync failed', err);
  } finally {
    await refreshPendingCount();
    useSyncStore.getState().setSyncing(false);
  }
}
