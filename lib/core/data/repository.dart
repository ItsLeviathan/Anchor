import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../db/database.dart';
import '../logic/logic.dart';
import '../models/models.dart';
import '../notifications/notification_service.dart' as notif;
import '../supabase/supabase_setup.dart';
import '../sync/queue.dart' show generateId;
import '../sync/sync_engine.dart';
import '../utils/dates.dart';

/// Write operations. Every write is local-first: persist to SQLite, then
/// queue for sync. Reminder scheduling is best-effort - a notification API
/// failure must never fail (or roll back) the actual mutation.

String _now() => DateTime.now().toUtc().toIso8601String();

Future<void> _safe(Future<void> Function() f, String what) async {
  try {
    await f();
  } catch (err) {
    debugPrint('Failed to $what: $err');
  }
}

Future<void> _save(String type, Map<String, Object?> row) async {
  await def(type).upsert(row);
  await enqueueUpsert(type, row);
}

Future<Map<String, Object?>> _require(String type, String id) async {
  final row = await def(type).get(id);
  if (row == null) throw StateError('$type $id not found locally');
  return row;
}

// ============================ tasks =========================================

Future<Task> createTask({
  required String userId,
  required String title,
  String? categoryId,
  String? dueDate,
  String? dueTime,
  String priority = 'medium',
  RecurrenceRule? recurrenceRule,
  int? estimatedDurationMinutes,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'category_id': categoryId,
    'title': title.trim(),
    'description': null,
    'due_date': dueDate,
    'due_time': dueTime,
    'priority': priority,
    'status': 'pending',
    'estimated_duration_minutes': estimatedDurationMinutes,
    'actual_duration_minutes': null,
    'recurrence_rule': recurrenceRule?.toJson(),
    'completed_at': null,
    'created_at': now,
    'updated_at': now,
  };
  await _save('task', row);
  final task = Task.fromRow(row);
  await _safe(() => notif.scheduleTaskReminder(task), 'schedule task reminder');
  return task;
}

Future<Task> updateTask(
  String id, {
  required String title,
  String? categoryId,
  String? dueDate,
  String? dueTime,
  required String priority,
  RecurrenceRule? recurrenceRule,
  int? estimatedDurationMinutes,
}) async {
  final row = {
    ...await _require('task', id),
    'title': title.trim(),
    'category_id': categoryId,
    'due_date': dueDate,
    'due_time': dueTime,
    'priority': priority,
    'recurrence_rule': recurrenceRule?.toJson(),
    'estimated_duration_minutes': estimatedDurationMinutes,
    'updated_at': _now(),
  };
  await _save('task', row);
  final task = Task.fromRow(row);
  await _safe(() => notif.scheduleTaskReminder(task), 'reschedule task reminder');
  return task;
}

Future<Task> _setTaskStatus(String id, String status) async {
  final row = {
    ...await _require('task', id),
    'status': status,
    'completed_at': status == 'completed' ? _now() : null,
    'updated_at': _now(),
  };
  await _save('task', row);
  return Task.fromRow(row);
}

/// Completing a recurring task also spawns its next single occurrence (never a
/// pre-materialized batch), generated lazily.
Future<void> completeTask(Task task) async {
  await _setTaskStatus(task.id, 'completed');
  await _safe(() => notif.cancelTaskReminder(task.id), 'cancel task reminder');

  if (task.recurrenceRule != null && task.dueDate != null) {
    await createTask(
      userId: task.userId,
      title: task.title,
      categoryId: task.categoryId,
      dueDate: computeNextDueDate(task.dueDate!, task.recurrenceRule!),
      dueTime: task.dueTime,
      priority: task.priority,
      recurrenceRule: task.recurrenceRule,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
    );
  }
}

Future<void> reopenTask(String id) async {
  final task = await _setTaskStatus(id, 'pending');
  await _safe(() => notif.scheduleTaskReminder(task), 'schedule task reminder');
}

Future<void> deleteTask(String id) async {
  await _safe(() => notif.cancelTaskReminder(id), 'cancel task reminder');
  await enqueueDelete('task', id);
}

// ============================ events ========================================

Future<CalendarEvent> createEvent({
  required String userId,
  required String calendarId,
  required String title,
  required DateTime startAt,
  required DateTime endAt,
  bool allDay = false,
  String? location,
  String? description,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'calendar_id': calendarId,
    'title': title.trim(),
    'location': location,
    'description': description,
    'start_at': startAt.toUtc().toIso8601String(),
    'end_at': endAt.toUtc().toIso8601String(),
    'all_day': allDay,
    'recurrence_rule': null,
    'created_at': now,
    'updated_at': now,
  };
  await _save('event', row);
  final event = CalendarEvent.fromRow(row);
  await _safe(() => notif.scheduleEventReminder(event), 'schedule event reminder');
  return event;
}

Future<void> deleteEvent(String id) async {
  await _safe(() => notif.cancelEventReminder(id), 'cancel event reminder');
  await enqueueDelete('event', id);
}

// ============================ expenses & bills ===============================

Future<Expense> createExpense({
  required String userId,
  required String type,
  required double amount,
  required String category,
  required String date,
  String currency = 'PHP',
  String? notes,
  String? paymentMethod,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'type': type,
    'amount': amount,
    'currency': currency,
    'category': category,
    'date': date,
    'payment_method': paymentMethod,
    'notes': notes,
    'recurrence_rule': null,
    'created_at': now,
    'updated_at': now,
  };
  await _save('expense', row);
  return Expense.fromRow(row);
}

Future<void> deleteExpense(String id) => enqueueDelete('expense', id);

Future<Bill> createBill({
  required String userId,
  required String name,
  required double amount,
  required String category,
  required String dueDate,
  String currency = 'PHP',
  RecurrenceRule? recurrenceRule,
  String? notes,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'name': name.trim(),
    'amount': amount,
    'currency': currency,
    'category': category,
    'due_date': dueDate,
    'payment_method': null,
    'notes': notes,
    'recurrence_rule': recurrenceRule?.toJson(),
    'status': 'unpaid',
    'paid_at': null,
    'created_at': now,
    'updated_at': now,
  };
  await _save('bill', row);
  final bill = Bill.fromRow(row);
  await _safe(() => notif.scheduleBillReminder(bill), 'schedule bill reminder');
  return bill;
}

Future<Bill> _setBillStatus(Bill bill, String status) async {
  final row = {
    ...await _require('bill', bill.id),
    'status': status,
    'paid_at': status == 'paid' ? _now() : null,
    'updated_at': _now(),
  };
  await _save('bill', row);
  return Bill.fromRow(row);
}

/// Marking a bill paid logs it as an expense and, for recurring bills, spawns
/// the next occurrence (one at a time).
Future<void> markBillPaid(Bill bill) async {
  await _setBillStatus(bill, 'paid');
  await _safe(() => notif.cancelBillReminder(bill.id), 'cancel bill reminder');

  await createExpense(
    userId: bill.userId,
    type: 'expense',
    amount: bill.amount,
    category: bill.category,
    date: toDateKey(DateTime.now()),
    currency: bill.currency,
    notes: 'Paid: ${bill.name}',
  );

  if (bill.recurrenceRule != null) {
    await createBill(
      userId: bill.userId,
      name: bill.name,
      amount: bill.amount,
      category: bill.category,
      dueDate: computeNextDueDate(bill.dueDate, bill.recurrenceRule!),
      currency: bill.currency,
      recurrenceRule: bill.recurrenceRule,
    );
  }
}

Future<void> markBillUnpaid(Bill bill) async {
  final unpaid = await _setBillStatus(bill, 'unpaid');
  await _safe(() => notif.scheduleBillReminder(unpaid), 'schedule bill reminder');
}

Future<void> deleteBill(String id) async {
  await enqueueDelete('bill', id);
  await _safe(() => notif.cancelBillReminder(id), 'cancel bill reminder');
}

// ============================ notes =========================================

Future<Note> createNote({
  required String userId,
  String? title,
  required String content,
  String? categoryId,
  List<String> tags = const [],
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'category_id': categoryId,
    'title': (title?.trim().isEmpty ?? true) ? null : title!.trim(),
    'content': content.trim(),
    'tags': tags,
    'is_pinned': false,
    'created_at': now,
    'updated_at': now,
  };
  await _save('note', row);
  return Note.fromRow(row);
}

Future<void> toggleNotePinned(Note note) async {
  final row = {...await _require('note', note.id), 'is_pinned': !note.isPinned, 'updated_at': _now()};
  await _save('note', row);
}

Future<void> deleteNote(String id) => enqueueDelete('note', id);

// ============================ habits ========================================

Future<Habit> createHabit({
  required String userId,
  required String name,
  required String frequency,
  List<int>? daysOfWeek,
  String? categoryId,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'category_id': categoryId,
    'name': name.trim(),
    'frequency': frequency,
    'days_of_week': daysOfWeek,
    'completed_dates': <String>[],
    'archived': false,
    'created_at': now,
    'updated_at': now,
  };
  await _save('habit', row);
  return Habit.fromRow(row);
}

/// Toggles today's completion. No shaming for a broken streak - the UI just
/// reflects the state.
Future<void> toggleHabitToday(Habit habit, [DateTime? now]) async {
  final key = toDateKey(now ?? DateTime.now());
  final done = habit.completedDates.contains(key);
  final next = done
      ? habit.completedDates.where((d) => d != key).toList()
      : [...habit.completedDates, key];
  final row = {...await _require('habit', habit.id), 'completed_dates': next, 'updated_at': _now()};
  await _save('habit', row);
}

Future<void> deleteHabit(String id) => enqueueDelete('habit', id);

// ============================ shopping ======================================

/// Everyone has one auto-seeded list (server migration); the client uses
/// whichever one it finds.
Future<void> _saveList(ShoppingList list, List<ShoppingItem> items) async {
  final row = {
    ...await _require('shopping_list', list.id),
    'items': items.map((i) => i.toJson()).toList(),
    'updated_at': _now(),
  };
  await _save('shopping_list', row);
}

Future<void> addShoppingItem(ShoppingList list, String name, {String? quantity}) => _saveList(list, [
      ...list.items,
      ShoppingItem(
        id: generateId(),
        name: name.trim(),
        quantity: (quantity?.trim().isEmpty ?? true) ? null : quantity!.trim(),
      ),
    ]);

Future<void> toggleShoppingItem(ShoppingList list, String itemId) =>
    _saveList(list, list.items.map((i) => i.id == itemId ? i.toggled() : i).toList());

Future<void> removeShoppingItem(ShoppingList list, String itemId) =>
    _saveList(list, list.items.where((i) => i.id != itemId).toList());

Future<void> clearCompletedShoppingItems(ShoppingList list) =>
    _saveList(list, list.items.where((i) => !i.isCompleted).toList());

// ============================ student =======================================

Future<Subject> createSubject({
  required String userId,
  required String name,
  required String color,
  String? instructor,
  String? term,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'name': name.trim(),
    'color': color,
    'instructor': instructor,
    'term': term,
    'created_at': now,
    'updated_at': now,
  };
  await _save('subject', row);
  return Subject.fromRow(row);
}

Future<void> deleteSubject(String id) => enqueueDelete('subject', id);

Future<Assignment> createAssignment({
  required String userId,
  required String subjectId,
  required String kind,
  required String title,
  String? dueDate,
  String? dueTime,
  String? notes,
}) async {
  final now = _now();
  final row = <String, Object?>{
    'id': generateId(),
    'user_id': userId,
    'subject_id': subjectId,
    'kind': kind,
    'title': title.trim(),
    'due_date': dueDate,
    'due_time': dueTime,
    'notes': notes,
    'status': 'pending',
    'completed_at': null,
    'created_at': now,
    'updated_at': now,
  };
  await _save('assignment', row);
  return Assignment.fromRow(row);
}

Future<void> toggleAssignment(Assignment a) async {
  final completing = !a.isCompleted;
  final row = {
    ...await _require('assignment', a.id),
    'status': completing ? 'completed' : 'pending',
    'completed_at': completing ? _now() : null,
    'updated_at': _now(),
  };
  await _save('assignment', row);
}

Future<void> deleteAssignment(String id) => enqueueDelete('assignment', id);

// ============================ documents (network-only) =======================

Future<List<AnchorDocument>> fetchDocuments() async {
  final data = await supabase
      .from('documents')
      .select()
      .order('expiration_date', ascending: true, nullsFirst: false);
  return (data as List).map((r) => AnchorDocument.fromRow(Map<String, Object?>.from(r as Map))).toList();
}

Future<AnchorDocument> createDocument({
  required String userId,
  required String name,
  required String category,
  required PlatformFile file,
  String? issueDate,
  String? expirationDate,
  String? notes,
}) async {
  final id = generateId();
  final storagePath = '$userId/$id-${file.name}';
  final bytes = await file.readAsBytes();
  final size = await file.length();

  await supabase.storage.from('documents').uploadBinary(
        storagePath,
        bytes,
        fileOptions: const FileOptions(upsert: false),
      );

  try {
    final data = await supabase
        .from('documents')
        .insert({
          'id': id,
          'user_id': userId,
          'name': name.trim(),
          'category': category,
          'storage_path': storagePath,
          'file_name': file.name,
          'mime_type': null,
          'file_size': size,
          'issue_date': issueDate,
          'expiration_date': expirationDate,
          'notes': notes,
        })
        .select()
        .single();
    final doc = AnchorDocument.fromRow(Map<String, Object?>.from(data));
    await _safe(() => notif.scheduleDocumentReminder(doc), 'schedule document reminder');
    return doc;
  } catch (_) {
    // Best-effort cleanup: don't leave an orphaned file in Storage.
    await supabase.storage.from('documents').remove([storagePath]);
    rethrow;
  }
}

/// Short-lived signed URL: the bucket is private, there's no permanent link.
Future<String> documentSignedUrl(String storagePath, {int expiresInSeconds = 60}) =>
    supabase.storage.from('documents').createSignedUrl(storagePath, expiresInSeconds);

Future<void> deleteDocument(AnchorDocument doc) async {
  await supabase.storage.from('documents').remove([doc.storagePath]);
  await supabase.from('documents').delete().eq('id', doc.id);
  await _safe(() => notif.cancelDocumentReminder(doc.id), 'cancel document reminder');
}
