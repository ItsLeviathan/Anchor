import 'dart:convert';
import 'dart:math';

import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../db/database.dart';

const _uuid = Uuid();

/// Every offline-capable entity gets its permanent id here, on the device, at
/// creation time; the same id is the row's id on the server.
String generateId() => _uuid.v4();

/// Bounded-retry policy: no retry mechanism may retry indefinitely. After
/// [maxSyncAttempts] failures - or immediately on a non-retryable error - an
/// entry is marked `failed` and the engine stops picking it up. Between
/// attempts it waits out an exponential backoff with jitter.
const int maxSyncAttempts = 6;
const int _baseBackoffMs = 30 * 1000;
const int _maxBackoffMs = 30 * 60 * 1000;

class QueueEntry {
  QueueEntry({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.payload,
  });
  final String id, entityType, entityId, operation;
  final Map<String, Object?>? payload;
}

String _now() => DateTime.now().toUtc().toIso8601String();

/// Queues an operation, coalescing with any operation already queued for the
/// same entity: three offline edits produce one 'upsert' with the latest
/// payload, and a 'delete' always replaces whatever was queued.
Future<void> enqueue(String entityType, String entityId, String operation,
    Map<String, Object?>? payload) async {
  final db = await AppDb.instance;
  final existing = await db.query('sync_queue',
      columns: ['id'],
      where: 'entity_type = ? AND entity_id = ?',
      whereArgs: [entityType, entityId],
      limit: 1);
  final encoded = payload == null ? null : jsonEncode(payload);

  if (existing.isNotEmpty) {
    // A fresh edit always gets a clean retry budget.
    await db.update(
      'sync_queue',
      {
        'operation': operation,
        'payload': encoded,
        'created_at': _now(),
        'attempts': 0,
        'last_error': null,
        'failed': 0,
        'next_attempt_at': null,
      },
      where: 'id = ?',
      whereArgs: [existing.first['id']],
    );
    return;
  }

  await db.insert('sync_queue', {
    'id': generateId(),
    'entity_type': entityType,
    'entity_id': entityId,
    'operation': operation,
    'payload': encoded,
    'created_at': _now(),
    'attempts': 0,
  });
}

/// Drops a pending entry without sending anything (row never reached server).
Future<void> dequeueForEntity(String entityType, String entityId) async {
  final db = await AppDb.instance;
  await db.delete('sync_queue',
      where: 'entity_type = ? AND entity_id = ?', whereArgs: [entityType, entityId]);
}

/// Entries the engine should attempt now: not failed, and outside backoff.
Future<List<QueueEntry>> listPending() async {
  final db = await AppDb.instance;
  final rows = await db.query(
    'sync_queue',
    where: 'failed = 0 AND (next_attempt_at IS NULL OR next_attempt_at <= ?)',
    whereArgs: [_now()],
    orderBy: 'created_at ASC',
  );
  return rows
      .map((r) => QueueEntry(
            id: r['id'] as String,
            entityType: r['entity_type'] as String,
            entityId: r['entity_id'] as String,
            operation: r['operation'] as String,
            payload: r['payload'] == null
                ? null
                : Map<String, Object?>.from(jsonDecode(r['payload'] as String) as Map),
          ))
      .toList();
}

Future<int> countPending() async {
  final db = await AppDb.instance;
  return Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM sync_queue')) ?? 0;
}

Future<int> countFailed() async {
  final db = await AppDb.instance;
  return Sqflite.firstIntValue(
          await db.rawQuery('SELECT COUNT(*) FROM sync_queue WHERE failed = 1')) ??
      0;
}

Future<void> removeEntry(String id) async {
  final db = await AppDb.instance;
  await db.delete('sync_queue', where: 'id = ?', whereArgs: [id]);
}

/// Records a failed push and decides whether it's worth trying again.
Future<void> markAttemptFailed(String id, String error, {bool retryable = true}) async {
  final db = await AppDb.instance;
  final rows = await db.query('sync_queue',
      columns: ['attempts'], where: 'id = ?', whereArgs: [id], limit: 1);
  final attempts = ((rows.isEmpty ? 0 : rows.first['attempts'] as int)) + 1;

  if (!retryable || attempts >= maxSyncAttempts) {
    await db.update('sync_queue',
        {'attempts': attempts, 'last_error': error, 'failed': 1, 'next_attempt_at': null},
        where: 'id = ?', whereArgs: [id]);
    return;
  }

  final backoff = min(_baseBackoffMs * pow(2, attempts - 1).toInt(), _maxBackoffMs);
  final jittered = backoff + Random().nextInt((backoff * 0.2).toInt() + 1);
  final next = DateTime.now().toUtc().add(Duration(milliseconds: jittered));
  await db.update(
    'sync_queue',
    {'attempts': attempts, 'last_error': error, 'next_attempt_at': next.toIso8601String()},
    where: 'id = ?',
    whereArgs: [id],
  );
}

/// Entity ids with a pending queue entry: the pull must not overwrite these.
Future<Set<String>> getPendingEntityIds(String entityType, [DatabaseExecutor? txn]) async {
  final db = txn ?? await AppDb.instance;
  final rows = await db.query('sync_queue',
      columns: ['entity_id'], where: 'entity_type = ?', whereArgs: [entityType]);
  return rows.map((r) => r['entity_id'] as String).toSet();
}
