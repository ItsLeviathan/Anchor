import 'dart:async';
import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// Local-first persistence: one SQLite connection and the full local schema.
/// Columns mirror the Supabase tables 1:1 (snake_case, same names). The id is
/// the same client-generated UUID the row uses on the server, so there is no
/// local-id/server-id pair to reconcile.
class AppDb {
  static Database? _db;
  static Future<Database>? _opening;

  static Future<Database> get instance =>
      _db != null ? Future.value(_db!) : (_opening ??= _open());

  static Future<Database> _open() async {
    final path = p.join(await getDatabasesPath(), 'anchor.db');
    final db = await openDatabase(
      path,
      version: 1,
      onConfigure: (db) async {
        await db.rawQuery('PRAGMA journal_mode = WAL');
      },
      onCreate: (db, _) async {
        for (final sql in _schema) {
          await db.execute(sql);
        }
      },
    );
    _db = db;
    return db;
  }

  /// Retry-friendly reset used by the bootstrap recovery screen.
  static void resetOpenAttempt() => _opening = null;

  // --- change notification (drives every reactive provider) ----------------
  static final StreamController<void> _changes = StreamController<void>.broadcast();
  static Stream<void> get changes => _changes.stream;
  static void notify() => _changes.add(null);
}

/// Emits [query]'s result now, and again after every local write.
Stream<T> watchQuery<T>(Future<T> Function() query) async* {
  yield await query();
  await for (final _ in AppDb.changes) {
    yield await query();
  }
}

const _entityColumns = '''
      deleted INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT''';

const List<String> _schema = [
  'CREATE TABLE profile_cache (id TEXT PRIMARY KEY NOT NULL, display_name TEXT, is_anonymous INTEGER NOT NULL DEFAULT 1, updated_at TEXT, cached_at TEXT)',
  'CREATE TABLE scheduled_notifications (entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, notification_id INTEGER NOT NULL, PRIMARY KEY (entity_type, entity_id))',
  'CREATE TABLE local_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)',
  '''CREATE TABLE local_tasks (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, category_id TEXT,
      title TEXT NOT NULL, description TEXT, due_date TEXT, due_time TEXT,
      priority TEXT NOT NULL, status TEXT NOT NULL,
      estimated_duration_minutes INTEGER, actual_duration_minutes INTEGER,
      recurrence_rule TEXT, completed_at TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_events (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, calendar_id TEXT NOT NULL,
      title TEXT NOT NULL, location TEXT, description TEXT,
      start_at TEXT NOT NULL, end_at TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0, recurrence_rule TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_expenses (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, type TEXT NOT NULL,
      amount REAL NOT NULL, currency TEXT NOT NULL, category TEXT NOT NULL,
      date TEXT NOT NULL, payment_method TEXT, notes TEXT, recurrence_rule TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_bills (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL,
      amount REAL NOT NULL, currency TEXT NOT NULL, category TEXT NOT NULL,
      due_date TEXT NOT NULL, payment_method TEXT, notes TEXT, recurrence_rule TEXT,
      status TEXT NOT NULL, paid_at TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_notes (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, category_id TEXT,
      title TEXT, content TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_habits (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, category_id TEXT,
      name TEXT NOT NULL, frequency TEXT NOT NULL, days_of_week TEXT,
      completed_dates TEXT NOT NULL DEFAULT '[]', archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_shopping_lists (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_subjects (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL,
      color TEXT NOT NULL, instructor TEXT, term TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  '''CREATE TABLE local_assignments (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, subject_id TEXT NOT NULL,
      kind TEXT NOT NULL, title TEXT NOT NULL, due_date TEXT, due_time TEXT,
      notes TEXT, status TEXT NOT NULL, completed_at TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
$_entityColumns)''',
  // Read-only local mirrors so category/calendar pickers work offline.
  'CREATE TABLE local_categories (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL, icon TEXT, is_default INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE local_calendars (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0)',
  // One row per pending entity; repeated edits coalesce (see sync/queue.dart).
  '''CREATE TABLE sync_queue (
      id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      operation TEXT NOT NULL, payload TEXT, created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT,
      next_attempt_at TEXT, failed INTEGER NOT NULL DEFAULT 0)''',
];

/// Describes one offline-capable entity: its local table, its Supabase table
/// and how each column is encoded in SQLite.
class EntityDef {
  const EntityDef({
    required this.type,
    required this.localTable,
    required this.remoteTable,
    required this.columns,
    this.jsonColumns = const {},
    this.boolColumns = const {},
    this.orderBy = 'created_at ASC',
  });

  final String type, localTable, remoteTable, orderBy;
  final List<String> columns;
  final Set<String> jsonColumns, boolColumns;

  Map<String, Object?> _encode(Map<String, Object?> row) {
    final out = <String, Object?>{};
    for (final c in columns) {
      final v = row[c];
      if (jsonColumns.contains(c)) {
        out[c] = v == null ? null : jsonEncode(v);
      } else if (boolColumns.contains(c)) {
        out[c] = (v == true || v == 1) ? 1 : 0;
      } else {
        out[c] = v;
      }
    }
    return out;
  }

  /// SQLite row -> remote-shaped row (no local bookkeeping columns).
  Map<String, Object?> decode(Map<String, Object?> raw) {
    final out = <String, Object?>{};
    for (final c in columns) {
      final v = raw[c];
      if (jsonColumns.contains(c)) {
        out[c] = v == null ? null : jsonDecode(v as String);
      } else if (boolColumns.contains(c)) {
        out[c] = v == 1 || v == true;
      } else {
        out[c] = v;
      }
    }
    return out;
  }

  /// Keeps only the columns this app knows about (the server may return more).
  Map<String, Object?> pick(Map<String, Object?> row) =>
      {for (final c in columns) c: row[c]};

  // --- store operations ----------------------------------------------------

  Future<List<Map<String, Object?>>> list(String userId) async {
    final db = await AppDb.instance;
    final rows = await db.query(localTable,
        where: 'user_id = ? AND deleted = 0', whereArgs: [userId], orderBy: orderBy);
    return rows.map(decode).toList();
  }

  Future<Map<String, Object?>?> get(String id) async {
    final db = await AppDb.instance;
    final rows = await db.query(localTable, where: 'id = ?', whereArgs: [id], limit: 1);
    return rows.isEmpty ? null : decode(rows.first);
  }

  Future<bool> hasEverSynced(String id) async {
    final db = await AppDb.instance;
    final rows = await db.query(localTable,
        columns: ['synced_at'], where: 'id = ?', whereArgs: [id], limit: 1);
    return rows.isNotEmpty && rows.first['synced_at'] != null;
  }

  Future<void> upsert(Map<String, Object?> row, {bool markSynced = false, DatabaseExecutor? txn}) async {
    final db = txn ?? await AppDb.instance;
    final enc = _encode(row);
    final cols = [...columns, 'deleted', 'synced_at'];
    final args = [...columns.map((c) => enc[c]), 0, markSynced ? DateTime.now().toUtc().toIso8601String() : null];
    final updates = columns
        .where((c) => c != 'id' && c != 'user_id' && c != 'created_at')
        .map((c) => '$c = excluded.$c')
        .join(', ');
    await db.rawInsert(
      'INSERT INTO $localTable (${cols.join(', ')}) VALUES (${List.filled(cols.length, '?').join(', ')}) '
      'ON CONFLICT(id) DO UPDATE SET $updates, deleted = 0, '
      'synced_at = COALESCE(excluded.synced_at, $localTable.synced_at)',
      args,
    );
    if (txn == null) AppDb.notify();
  }

  Future<void> markSynced(String id) async {
    final db = await AppDb.instance;
    await db.update(localTable, {'synced_at': DateTime.now().toUtc().toIso8601String()},
        where: 'id = ?', whereArgs: [id]);
    AppDb.notify();
  }

  /// Soft delete: hides the row immediately without losing it before the
  /// sync engine has told the server.
  Future<void> markDeletedLocally(String id) async {
    final db = await AppDb.instance;
    await db.update(localTable,
        {'deleted': 1, 'updated_at': DateTime.now().toUtc().toIso8601String()},
        where: 'id = ?', whereArgs: [id]);
    AppDb.notify();
  }

  Future<List<String>> localIds(String userId, [DatabaseExecutor? txn]) async {
    final db = txn ?? await AppDb.instance;
    final rows = await db.query(localTable,
        columns: ['id'], where: 'user_id = ?', whereArgs: [userId]);
    return rows.map((r) => r['id'] as String).toList();
  }

  Future<void> remove(String id, {DatabaseExecutor? txn}) async {
    final db = txn ?? await AppDb.instance;
    await db.delete(localTable, where: 'id = ?', whereArgs: [id]);
    if (txn == null) AppDb.notify();
  }
}

const _ts = ['created_at', 'updated_at'];

final Map<String, EntityDef> entityDefs = {
  'task': const EntityDef(
    type: 'task', localTable: 'local_tasks', remoteTable: 'tasks',
    columns: ['id', 'user_id', 'category_id', 'title', 'description', 'due_date', 'due_time', 'priority', 'status', 'estimated_duration_minutes', 'actual_duration_minutes', 'recurrence_rule', 'completed_at', ..._ts],
    jsonColumns: {'recurrence_rule'},
    orderBy: 'due_date IS NULL, due_date ASC',
  ),
  'event': const EntityDef(
    type: 'event', localTable: 'local_events', remoteTable: 'events',
    columns: ['id', 'user_id', 'calendar_id', 'title', 'location', 'description', 'start_at', 'end_at', 'all_day', 'recurrence_rule', ..._ts],
    jsonColumns: {'recurrence_rule'}, boolColumns: {'all_day'},
    orderBy: 'start_at ASC',
  ),
  'expense': const EntityDef(
    type: 'expense', localTable: 'local_expenses', remoteTable: 'expenses',
    columns: ['id', 'user_id', 'type', 'amount', 'currency', 'category', 'date', 'payment_method', 'notes', 'recurrence_rule', ..._ts],
    jsonColumns: {'recurrence_rule'},
    orderBy: 'date DESC, created_at DESC',
  ),
  'bill': const EntityDef(
    type: 'bill', localTable: 'local_bills', remoteTable: 'bills',
    columns: ['id', 'user_id', 'name', 'amount', 'currency', 'category', 'due_date', 'payment_method', 'notes', 'recurrence_rule', 'status', 'paid_at', ..._ts],
    jsonColumns: {'recurrence_rule'},
    orderBy: 'due_date ASC',
  ),
  'note': const EntityDef(
    type: 'note', localTable: 'local_notes', remoteTable: 'notes',
    columns: ['id', 'user_id', 'category_id', 'title', 'content', 'tags', 'is_pinned', ..._ts],
    jsonColumns: {'tags'}, boolColumns: {'is_pinned'},
    orderBy: 'is_pinned DESC, updated_at DESC',
  ),
  'habit': const EntityDef(
    type: 'habit', localTable: 'local_habits', remoteTable: 'habits',
    columns: ['id', 'user_id', 'category_id', 'name', 'frequency', 'days_of_week', 'completed_dates', 'archived', ..._ts],
    jsonColumns: {'days_of_week', 'completed_dates'}, boolColumns: {'archived'},
    orderBy: 'created_at ASC',
  ),
  'shopping_list': const EntityDef(
    type: 'shopping_list', localTable: 'local_shopping_lists', remoteTable: 'shopping_lists',
    columns: ['id', 'user_id', 'name', 'items', ..._ts],
    jsonColumns: {'items'},
    orderBy: 'created_at ASC',
  ),
  'subject': const EntityDef(
    type: 'subject', localTable: 'local_subjects', remoteTable: 'subjects',
    columns: ['id', 'user_id', 'name', 'color', 'instructor', 'term', ..._ts],
    orderBy: 'name ASC',
  ),
  'assignment': const EntityDef(
    type: 'assignment', localTable: 'local_assignments', remoteTable: 'assignments',
    columns: ['id', 'user_id', 'subject_id', 'kind', 'title', 'due_date', 'due_time', 'notes', 'status', 'completed_at', ..._ts],
    orderBy: 'due_date IS NULL, due_date ASC',
  ),
};

EntityDef def(String type) => entityDefs[type]!;

// --- read-only mirrors ------------------------------------------------------

Future<List<Map<String, Object?>>> listCategories(String userId) async {
  final db = await AppDb.instance;
  return db.query('local_categories',
      where: 'user_id = ?', whereArgs: [userId], orderBy: 'sort_order ASC');
}

Future<List<Map<String, Object?>>> listCalendars(String userId) async {
  final db = await AppDb.instance;
  return db.query('local_calendars',
      where: 'user_id = ?', whereArgs: [userId], orderBy: 'is_default DESC');
}

Future<void> replaceCategories(String userId, List<Map<String, Object?>> rows) async {
  final db = await AppDb.instance;
  await db.transaction((txn) async {
    await txn.delete('local_categories', where: 'user_id = ?', whereArgs: [userId]);
    for (final r in rows) {
      await txn.insert('local_categories', {
        'id': r['id'], 'user_id': r['user_id'], 'name': r['name'], 'color': r['color'],
        'icon': r['icon'], 'is_default': r['is_default'] == true ? 1 : 0,
        'sort_order': r['sort_order'] ?? 0,
      });
    }
  });
  AppDb.notify();
}

Future<void> replaceCalendars(String userId, List<Map<String, Object?>> rows) async {
  final db = await AppDb.instance;
  await db.transaction((txn) async {
    await txn.delete('local_calendars', where: 'user_id = ?', whereArgs: [userId]);
    for (final r in rows) {
      await txn.insert('local_calendars', {
        'id': r['id'], 'user_id': r['user_id'], 'name': r['name'], 'color': r['color'],
        'is_default': r['is_default'] == true ? 1 : 0,
      });
    }
  });
  AppDb.notify();
}

// --- device-local settings & notification bookkeeping -----------------------

Future<String?> getLocalSetting(String key) async {
  final db = await AppDb.instance;
  final rows = await db.query('local_settings', where: 'key = ?', whereArgs: [key], limit: 1);
  return rows.isEmpty ? null : rows.first['value'] as String;
}

Future<void> setLocalSetting(String key, String value) async {
  final db = await AppDb.instance;
  await db.insert('local_settings', {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace);
}

Future<void> cacheProfile({required String id, String? displayName, required bool isAnonymous}) async {
  final db = await AppDb.instance;
  final now = DateTime.now().toUtc().toIso8601String();
  await db.insert(
    'profile_cache',
    {'id': id, 'display_name': displayName, 'is_anonymous': isAnonymous ? 1 : 0, 'updated_at': now, 'cached_at': now},
    conflictAlgorithm: ConflictAlgorithm.replace,
  );
}

Future<int?> getScheduledNotificationId(String entityType, String entityId) async {
  final db = await AppDb.instance;
  final rows = await db.query('scheduled_notifications',
      where: 'entity_type = ? AND entity_id = ?', whereArgs: [entityType, entityId], limit: 1);
  return rows.isEmpty ? null : rows.first['notification_id'] as int;
}

Future<void> setScheduledNotificationId(String entityType, String entityId, int id) async {
  final db = await AppDb.instance;
  await db.insert('scheduled_notifications',
      {'entity_type': entityType, 'entity_id': entityId, 'notification_id': id},
      conflictAlgorithm: ConflictAlgorithm.replace);
}

Future<void> clearScheduledNotificationId(String entityType, String entityId) async {
  final db = await AppDb.instance;
  await db.delete('scheduled_notifications',
      where: 'entity_type = ? AND entity_id = ?', whereArgs: [entityType, entityId]);
}

Future<void> clearAllScheduledNotificationIds() async {
  final db = await AppDb.instance;
  await db.delete('scheduled_notifications');
}
