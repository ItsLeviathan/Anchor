import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../db/database.dart';
import 'queue.dart';

/// Conflict resolution: Anchor is single-user, so the only way two writes race
/// is the same account editing from two devices while one was offline. Every
/// push is an unconditional upsert - whichever device's change reaches the
/// server last wins outright (no field-level merge).
class SyncStatus {
  const SyncStatus({this.isOnline = true, this.isSyncing = false, this.pending = 0, this.failed = 0});
  final bool isOnline, isSyncing;
  final int pending, failed;

  SyncStatus copyWith({bool? isOnline, bool? isSyncing, int? pending, int? failed}) => SyncStatus(
        isOnline: isOnline ?? this.isOnline,
        isSyncing: isSyncing ?? this.isSyncing,
        pending: pending ?? this.pending,
        failed: failed ?? this.failed,
      );
}

/// Global, listenable sync state (read by the status badge and Profile).
final ValueNotifier<SyncStatus> syncStatus = ValueNotifier(const SyncStatus());

/// Hook the app sets so local writes can refresh home-screen widgets.
void Function()? onLocalDataChanged;

SupabaseClient get _sb => Supabase.instance.client;

const _allTypes = [
  'task', 'event', 'expense', 'bill', 'note', 'habit', 'shopping_list', 'subject', 'assignment',
];

void _set(SyncStatus Function(SyncStatus) f) => syncStatus.value = f(syncStatus.value);

Future<void> refreshPendingCount() async {
  final counts = await Future.wait([countPending(), countFailed()]);
  _set((s) => s.copyWith(pending: counts[0], failed: counts[1]));
}

void setOnline(bool online) => _set((s) => s.copyWith(isOnline: online));

/// Classifies a failed push: auth/authorization and validation failures fail
/// identically on every retry, so only transient errors (network, 5xx) retry.
bool isRetryableSyncError(Object err) {
  if (err is AuthException) return false;
  if (err is PostgrestException) {
    final code = err.code;
    if (code == '42501') return false; // RLS denial
    if (code != null && (code.startsWith('22') || code.startsWith('23'))) return false;
    final status = int.tryParse(code ?? '');
    if (status == 401 || status == 403) return false;
  }
  return true;
}

/// Queues a create/update for later replay and reflects the new count.
Future<void> enqueueUpsert(String entityType, Map<String, Object?> row) async {
  await enqueue(entityType, row['id'] as String, 'upsert', row);
  await refreshPendingCount();
  triggerFlush();
  onLocalDataChanged?.call();
}

/// Owns the full delete decision so repositories don't need sync knowledge:
///  - never reached the server -> remove locally, nothing to tell the server
///  - already synced -> soft-delete locally and queue the remote delete
Future<void> enqueueDelete(String entityType, String entityId) async {
  final d = def(entityType);
  if (!await d.hasEverSynced(entityId)) {
    await dequeueForEntity(entityType, entityId);
    await d.remove(entityId);
  } else {
    await d.markDeletedLocally(entityId);
    await enqueue(entityType, entityId, 'delete', null);
  }
  await refreshPendingCount();
  triggerFlush();
  onLocalDataChanged?.call();
}

bool _isFlushing = false;

/// Fire-and-forget trigger used by mutations.
void triggerFlush() {
  if (!syncStatus.value.isOnline) return;
  flushQueue().catchError((Object e) => debugPrint('Sync flush failed: $e'));
}

/// Pushes every queued operation, one at a time, in queue order. A failure on
/// one entry doesn't block the rest.
Future<void> flushQueue() async {
  if (_isFlushing) return;
  _isFlushing = true;
  _set((s) => s.copyWith(isSyncing: true));

  try {
    for (final entry in await listPending()) {
      final d = def(entry.entityType);
      try {
        if (entry.operation == 'upsert' && entry.payload != null) {
          await _sb.from(d.remoteTable).upsert(entry.payload!);
          await d.markSynced(entry.entityId);
        } else if (entry.operation == 'delete') {
          await _sb.from(d.remoteTable).delete().eq('id', entry.entityId);
          await d.remove(entry.entityId);
        }
        await removeEntry(entry.id);
      } catch (err) {
        await markAttemptFailed(entry.id, err.toString(),
            retryable: isRetryableSyncError(err));
      }
    }
  } finally {
    await refreshPendingCount();
    _set((s) => s.copyWith(isSyncing: false));
    _isFlushing = false;
    onLocalDataChanged?.call();
  }
}

/// Merges server state into the local tables. Rows with a pending queue entry
/// are left untouched (the local edit wins until pushed); local rows missing
/// from the server and not pending are removed. The pending set is read
/// *inside* the per-entity transaction, right before writing, to keep the
/// stale-overwrite window as small as possible.
Future<void> pullRemoteChanges(String userId) async {
  final db = await AppDb.instance;

  for (final type in _allTypes) {
    final d = def(type);
    final remote = List<Map<String, Object?>>.from(
        (await _sb.from(d.remoteTable).select()) as List);
    final remoteRows = remote.map(d.pick).toList();
    final remoteIds = remoteRows.map((r) => r['id'] as String).toSet();

    await db.transaction((txn) async {
      final pending = await getPendingEntityIds(type, txn);
      final localIds = await d.localIds(userId, txn);
      for (final row in remoteRows) {
        if (pending.contains(row['id'])) continue;
        await d.upsert(row, markSynced: true, txn: txn);
      }
      for (final id in localIds) {
        if (!remoteIds.contains(id) && !pending.contains(id)) await d.remove(id, txn: txn);
      }
    });
  }

  final cats = List<Map<String, Object?>>.from(
      (await _sb.from('categories').select().order('sort_order', ascending: true)) as List);
  final cals = List<Map<String, Object?>>.from(
      (await _sb.from('calendars').select().order('is_default', ascending: false)) as List);
  await replaceCategories(userId, cats);
  await replaceCalendars(userId, cals);
  AppDb.notify();
}

/// Serializes the full sync cycles so app-start and reconnect can never run
/// concurrently; a caller arriving mid-cycle joins the running one.
Future<void>? _activeCycle;

Future<void> _runCycle(String label, Future<void> Function() fn) {
  if (_activeCycle != null) return _activeCycle!;
  final cycle = () async {
    _set((s) => s.copyWith(isSyncing: true));
    try {
      await fn();
    } catch (err) {
      debugPrint('$label failed: $err');
    } finally {
      await refreshPendingCount();
      _set((s) => s.copyWith(isSyncing: false));
      _activeCycle = null;
    }
  }();
  _activeCycle = cycle;
  return cycle;
}

/// Called once when a session becomes available.
Future<void> syncOnAppStart(String userId) => _runCycle('Initial sync', () async {
      await pullRemoteChanges(userId);
      await flushQueue();
    });

/// Push first so local edits aren't clobbered by the pull that follows.
Future<void> syncOnReconnect(String userId) => _runCycle('Reconnect sync', () async {
      await flushQueue();
      await pullRemoteChanges(userId);
    });
