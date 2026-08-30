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
import { deleteRemoteExpense, fetchRemoteExpenses, upsertRemoteExpense } from './remoteExpenses';
import { deleteRemoteBill, fetchRemoteBills, upsertRemoteBill } from './remoteBills';
import { deleteRemoteNote, fetchRemoteNotes, upsertRemoteNote } from './remoteNotes';
import { deleteRemoteHabit, fetchRemoteHabits, upsertRemoteHabit } from './remoteHabits';
import { deleteRemoteShoppingList, fetchRemoteShoppingLists, upsertRemoteShoppingList } from './remoteShoppingLists';

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
};

const ALL_ENTITY_TYPES: SyncEntityType[] = ['task', 'event', 'expense', 'bill', 'note', 'habit', 'shopping_list'];

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
  for (const entityType of ALL_ENTITY_TYPES) {
    const adapter = adapters[entityType];

    const [remoteRows, pendingIds, localIds] = await Promise.all([
      adapter.fetchRemote(),
      getPendingEntityIds(entityType),
      adapter.fetchLocalIds(userId),
    ]);

    const remoteIds = new Set(remoteRows.map((row) => row.id as string));

    for (const row of remoteRows) {
      if (pendingIds.has(row.id)) continue;
      await adapter.upsertLocal(row, { markSynced: true });
    }

    for (const id of localIds) {
      if (!remoteIds.has(id) && !pendingIds.has(id)) await adapter.removeLocal(id);
    }
  }

  const [remoteCategories, remoteCalendars] = await Promise.all([fetchRemoteCategories(), fetchRemoteCalendars()]);
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
