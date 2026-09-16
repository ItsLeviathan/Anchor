import { replaceLocalCategories } from '../database/localCategories';
import { replaceLocalCalendars } from '../database/localCalendars';
import {
  getLocalTaskIds,
  hasTaskEverSynced,
  markTaskDeletedLocally,
  markTaskSynced,
  removeLocalTask,
  upsertLocalTask,
} from '../database/localTasks';
import {
  getLocalEventIds,
  hasEventEverSynced,
  markEventDeletedLocally,
  markEventSynced,
  removeLocalEvent,
  upsertLocalEvent,
} from '../database/localEvents';
import {
  getLocalExpenseIds,
  hasExpenseEverSynced,
  markExpenseDeletedLocally,
  markExpenseSynced,
  removeLocalExpense,
  upsertLocalExpense,
} from '../database/localExpenses';
import {
  getLocalBillIds,
  hasBillEverSynced,
  markBillDeletedLocally,
  markBillSynced,
  removeLocalBill,
  upsertLocalBill,
} from '../database/localBills';
import {
  getLocalNoteIds,
  hasNoteEverSynced,
  markNoteDeletedLocally,
  markNoteSynced,
  removeLocalNote,
  upsertLocalNote,
} from '../database/localNotes';
import {
  getLocalHabitIds,
  hasHabitEverSynced,
  markHabitDeletedLocally,
  markHabitSynced,
  removeLocalHabit,
  upsertLocalHabit,
} from '../database/localHabits';
import {
  getLocalShoppingListIds,
  hasShoppingListEverSynced,
  markShoppingListDeletedLocally,
  markShoppingListSynced,
  removeLocalShoppingList,
  upsertLocalShoppingList,
} from '../database/localShoppingLists';
import {
  getLocalSubjectIds,
  hasSubjectEverSynced,
  markSubjectDeletedLocally,
  markSubjectSynced,
  removeLocalSubject,
  upsertLocalSubject,
} from '../database/localSubjects';
import {
  getLocalAssignmentIds,
  hasAssignmentEverSynced,
  markAssignmentDeletedLocally,
  markAssignmentSynced,
  removeLocalAssignment,
  upsertLocalAssignment,
} from '../database/localAssignments';
import { getDb } from '../database/db';
import { useSyncStore } from '../../store/useSyncStore';
import {
  countFailed,
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
import { deleteRemoteExpense, fetchRemoteExpenses, upsertRemoteExpense } from './remoteExpenses';
import { deleteRemoteBill, fetchRemoteBills, upsertRemoteBill } from './remoteBills';
import { deleteRemoteNote, fetchRemoteNotes, upsertRemoteNote } from './remoteNotes';
import { deleteRemoteHabit, fetchRemoteHabits, upsertRemoteHabit } from './remoteHabits';
import { deleteRemoteShoppingList, fetchRemoteShoppingLists, upsertRemoteShoppingList } from './remoteShoppingLists';
import { deleteRemoteSubject, fetchRemoteSubjects, upsertRemoteSubject } from './remoteSubjects';
import { deleteRemoteAssignment, fetchRemoteAssignments, upsertRemoteAssignment } from './remoteAssignments';

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

/**
 * Every offline-capable entity type plugs into the engine through one of
 * these adapters. Adding a future type (documents, notes, habits,
 * shopping items) means writing a local repo + a remote repo (same shape
 * as everything in lib/database/local*.ts and lib/sync/remote*.ts) and
 * registering it here - flushQueue/pullRemoteChanges/enqueueDelete never
 * need to change.
 */
interface EntityAdapter {
  fetchLocalIds: (userId: string) => Promise<string[]>;
  hasEverSynced: (id: string) => Promise<boolean>;
  markDeletedLocally: (id: string) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  removeLocal: (id: string) => Promise<void>;
  upsertLocal: (row: any, options?: { markSynced?: boolean }) => Promise<void>;
  fetchRemote: () => Promise<any[]>;
  upsertRemote: (row: any) => Promise<void>;
  deleteRemote: (id: string) => Promise<void>;
}

const adapters: Record<SyncEntityType, EntityAdapter> = {
  task: {
    fetchLocalIds: getLocalTaskIds,
    hasEverSynced: hasTaskEverSynced,
    markDeletedLocally: markTaskDeletedLocally,
    markSynced: markTaskSynced,
    removeLocal: removeLocalTask,
    upsertLocal: upsertLocalTask,
    fetchRemote: fetchRemoteTasks,
    upsertRemote: upsertRemoteTask,
    deleteRemote: deleteRemoteTask,
  },
  event: {
    fetchLocalIds: getLocalEventIds,
    hasEverSynced: hasEventEverSynced,
    markDeletedLocally: markEventDeletedLocally,
    markSynced: markEventSynced,
    removeLocal: removeLocalEvent,
    upsertLocal: upsertLocalEvent,
    fetchRemote: fetchRemoteEvents,
    upsertRemote: upsertRemoteEvent,
    deleteRemote: deleteRemoteEvent,
  },
  expense: {
    fetchLocalIds: getLocalExpenseIds,
    hasEverSynced: hasExpenseEverSynced,
    markDeletedLocally: markExpenseDeletedLocally,
    markSynced: markExpenseSynced,
    removeLocal: removeLocalExpense,
    upsertLocal: upsertLocalExpense,
    fetchRemote: fetchRemoteExpenses,
    upsertRemote: upsertRemoteExpense,
    deleteRemote: deleteRemoteExpense,
  },
  bill: {
    fetchLocalIds: getLocalBillIds,
    hasEverSynced: hasBillEverSynced,
    markDeletedLocally: markBillDeletedLocally,
    markSynced: markBillSynced,
    removeLocal: removeLocalBill,
    upsertLocal: upsertLocalBill,
    fetchRemote: fetchRemoteBills,
    upsertRemote: upsertRemoteBill,
    deleteRemote: deleteRemoteBill,
  },
  note: {
    fetchLocalIds: getLocalNoteIds,
    hasEverSynced: hasNoteEverSynced,
    markDeletedLocally: markNoteDeletedLocally,
    markSynced: markNoteSynced,
    removeLocal: removeLocalNote,
    upsertLocal: upsertLocalNote,
    fetchRemote: fetchRemoteNotes,
    upsertRemote: upsertRemoteNote,
    deleteRemote: deleteRemoteNote,
  },
  habit: {
    fetchLocalIds: getLocalHabitIds,
    hasEverSynced: hasHabitEverSynced,
    markDeletedLocally: markHabitDeletedLocally,
    markSynced: markHabitSynced,
    removeLocal: removeLocalHabit,
    upsertLocal: upsertLocalHabit,
    fetchRemote: fetchRemoteHabits,
    upsertRemote: upsertRemoteHabit,
    deleteRemote: deleteRemoteHabit,
  },
  shopping_list: {
    fetchLocalIds: getLocalShoppingListIds,
    hasEverSynced: hasShoppingListEverSynced,
    markDeletedLocally: markShoppingListDeletedLocally,
    markSynced: markShoppingListSynced,
    removeLocal: removeLocalShoppingList,
    upsertLocal: upsertLocalShoppingList,
    fetchRemote: fetchRemoteShoppingLists,
    upsertRemote: upsertRemoteShoppingList,
    deleteRemote: deleteRemoteShoppingList,
  },
  subject: {
    fetchLocalIds: getLocalSubjectIds,
    hasEverSynced: hasSubjectEverSynced,
    markDeletedLocally: markSubjectDeletedLocally,
    markSynced: markSubjectSynced,
    removeLocal: removeLocalSubject,
    upsertLocal: upsertLocalSubject,
    fetchRemote: fetchRemoteSubjects,
    upsertRemote: upsertRemoteSubject,
    deleteRemote: deleteRemoteSubject,
  },
  assignment: {
    fetchLocalIds: getLocalAssignmentIds,
    hasEverSynced: hasAssignmentEverSynced,
    markDeletedLocally: markAssignmentDeletedLocally,
    markSynced: markAssignmentSynced,
    removeLocal: removeLocalAssignment,
    upsertLocal: upsertLocalAssignment,
    fetchRemote: fetchRemoteAssignments,
    upsertRemote: upsertRemoteAssignment,
    deleteRemote: deleteRemoteAssignment,
  },
};

const ALL_ENTITY_TYPES: SyncEntityType[] = [
  'task',
  'event',
  'expense',
  'bill',
  'note',
  'habit',
  'shopping_list',
  'subject',
  'assignment',
];

export async function refreshPendingCount(): Promise<void> {
  const [pending, failed] = await Promise.all([countPending(), countFailed()]);
  useSyncStore.getState().setPendingCount(pending);
  useSyncStore.getState().setFailedCount(failed);
}

/**
 * Classifies a failed push so markAttemptFailed knows whether retrying can
 * ever succeed. Auth/authorization failures (expired/invalid session, RLS
 * denial) and validation failures (bad payload shape, constraint violation)
 * will fail identically on every retry - resending them just wastes
 * requests and, for auth errors, risks hammering the auth endpoint. Only
 * genuinely transient errors (network blips, 5xx, timeouts) are retried.
 */
function isRetryableSyncError(err: unknown): boolean {
  const anyErr = err as { code?: string; status?: number; name?: string } | null | undefined;
  if (!anyErr || typeof anyErr !== 'object') return true;

  if (anyErr.status === 401 || anyErr.status === 403) return false;
  if (anyErr.name === 'AuthApiError' || anyErr.name === 'AuthSessionMissingError') return false;

  // Postgres/PostgREST error codes: 22xxx data exception, 23xxx integrity
  // constraint violation (unique/check/fk), 42501 insufficient_privilege
  // (RLS denial). None of these are fixed by resending the same payload.
  if (typeof anyErr.code === 'string') {
    if (anyErr.code === '42501') return false;
    if (anyErr.code.startsWith('22') || anyErr.code.startsWith('23')) return false;
  }

  return true;
}

/** Best-effort widget refresh, usable regardless of connectivity - widgets
 *  read purely local SQLite, so they should reflect a local write
 *  immediately rather than waiting on a sync flush that may not run for a
 *  while (or ever, if the device stays offline). */
function refreshWidgetsBestEffort(): void {
  import('../widgets/refreshWidgets').then(({ refreshWidgets }) =>
    refreshWidgets().catch((err) => console.error('Widget refresh failed', err))
  );
}

/** Queues a create/update for later replay, immediately reflecting the new count in the sync status UI. */
export async function enqueueUpsert(entityType: SyncEntityType, entityId: string, payload: Record<string, unknown>) {
  await enqueue(entityType, entityId, 'upsert', payload);
  await refreshPendingCount();
  triggerFlush();
  refreshWidgetsBestEffort();
}

/**
 * Owns the full delete decision so callers (the domain repos) don't have
 * to know about sync state at all:
 *  - never reached the server -> just remove it locally, nothing to tell
 *    the server, no orphaned soft-deleted row left behind
 *  - already synced -> soft-delete locally (stays hidden immediately) and
 *    queue the remote delete for the engine to replay
 */
export async function enqueueDelete(entityType: SyncEntityType, entityId: string): Promise<void> {
  const adapter = adapters[entityType];
  const everSynced = await adapter.hasEverSynced(entityId);

  if (!everSynced) {
    await dequeueForEntity(entityType, entityId);
    await adapter.removeLocal(entityId);
  } else {
    await adapter.markDeletedLocally(entityId);
    await enqueue(entityType, entityId, 'delete', null);
  }

  await refreshPendingCount();
  triggerFlush();
  refreshWidgetsBestEffort();
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
      const adapter = adapters[entry.entityType];
      try {
        if (entry.operation === 'upsert' && entry.payload) {
          await adapter.upsertRemote(entry.payload);
          await adapter.markSynced(entry.entityId);
        } else if (entry.operation === 'delete') {
          await adapter.deleteRemote(entry.entityId);
          await adapter.removeLocal(entry.entityId);
        }

        await removeEntry(entry.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await markAttemptFailed(entry.id, message, isRetryableSyncError(err));
        // Keep going - one bad entry (e.g. a transient network blip mid-flush) shouldn't stall the rest of the queue.
      }
    }
  } finally {
    await refreshPendingCount();
    useSyncStore.getState().setSyncing(false);
    isFlushing = false;
    refreshWidgetsBestEffort();
  }
}

/**
 * Merges server state into the local tables. Any row with a pending queue
 * entry is left untouched - the local edit takes precedence until it's
 * actually pushed, rather than the pull silently overwriting it. Rows that
 * exist locally but no longer exist on the server (and aren't pending) are
 * removed, so deletions made elsewhere - the Supabase dashboard, a future
 * second device - eventually show up here too.
 *
 * Race note: `pendingIds` is deliberately fetched *after* the (potentially
 * slow) network round trip for `fetchRemote`, not alongside it. An edit
 * queued while the fetch was in flight would otherwise miss the pending
 * check entirely and get clobbered by the older server row it fetched
 * before the edit happened - fetching it last shrinks that window from "the
 * whole network round trip" down to "the local upsert loop below". A local
 * edit made mid-loop is a narrower, harder-to-close window (would need the
 * pending check and the write to be one atomic unit) - flagged for human
 * review rather than fixed here since it needs a structural change (see
 * audit report).
 */
export async function pullRemoteChanges(userId: string): Promise<void> {
  const db = await getDb();

  for (const entityType of ALL_ENTITY_TYPES) {
    const adapter = adapters[entityType];

    const [remoteRows, localIds] = await Promise.all([adapter.fetchRemote(), adapter.fetchLocalIds(userId)]);
    const pendingIds = await getPendingEntityIds(entityType);

    const remoteIds = new Set(remoteRows.map((row) => row.id as string));

    // One transaction per entity type so a crash/kill mid-merge can't leave
    // the local table half-updated relative to sync_queue's view of it.
    await db.withTransactionAsync(async () => {
      for (const row of remoteRows) {
        if (pendingIds.has(row.id)) continue;
        await adapter.upsertLocal(row, { markSynced: true });
      }

      for (const id of localIds) {
        if (!remoteIds.has(id) && !pendingIds.has(id)) await adapter.removeLocal(id);
      }
    });
  }

  const [remoteCategories, remoteCalendars] = await Promise.all([fetchRemoteCategories(), fetchRemoteCalendars()]);
  await replaceLocalCategories(userId, remoteCategories);
  await replaceLocalCalendars(userId, remoteCalendars);
}

/**
 * Serializes the two full sync cycles below (app-start and reconnect) so
 * they can never run concurrently. Both call pullRemoteChanges, which has
 * no locking of its own - two overlapping passes over the same entity
 * tables (e.g. app cold-starts online, then NetInfo's first callback fires
 * a "reconnect" a moment later) would interleave reads/writes across the
 * same rows and could re-introduce exactly the stale-overwrite race that
 * pullRemoteChanges' own pending-id check is trying to avoid. A caller that
 * arrives while a cycle is already running joins that cycle's promise
 * instead of starting a second one - it still does what it's called to
 * (push + pull get applied), that work is just shared.
 */
let activeSyncCycle: Promise<void> | null = null;

function runSyncCycle(label: string, fn: () => Promise<void>): Promise<void> {
  if (activeSyncCycle) return activeSyncCycle;

  const cycle = (async () => {
    useSyncStore.getState().setSyncing(true);
    try {
      await fn();
    } catch (err) {
      console.error(`${label} failed`, err);
    } finally {
      await refreshPendingCount();
      useSyncStore.getState().setSyncing(false);
      activeSyncCycle = null;
    }
  })();

  activeSyncCycle = cycle;
  return cycle;
}

/** Called once when a session becomes available (app start / sign-in). */
export function syncOnAppStart(userId: string): Promise<void> {
  return runSyncCycle('Initial sync', async () => {
    await pullRemoteChanges(userId);
    await flushQueue();
  });
}

/** Called when connectivity is restored - push first so local edits aren't clobbered by the pull that follows. */
export function syncOnReconnect(userId: string): Promise<void> {
  return runSyncCycle('Reconnect sync', async () => {
    await flushQueue();
    await pullRemoteChanges(userId);
  });
}
