import '../utils/dates.dart';

/// Domain models. All are built from a "remote-shaped" row map (snake_case
/// keys, JSON columns already decoded, booleans as bool) - the same shape
/// Supabase returns and the sync queue stores.

DateTime _dt(Object? v) => DateTime.parse(v as String);
double _num(Object? v) => v is num ? v.toDouble() : double.parse(v.toString());
List<T> _list<T>(Object? v) => v == null ? <T>[] : List<T>.from(v as List);

class RecurrenceRule {
  const RecurrenceRule({required this.freq, this.interval = 1, this.byweekday});

  /// daily | weekly | monthly | yearly
  final String freq;
  final int interval;

  /// 0 = Sunday ... 6 = Saturday, used when freq is weekly.
  final List<int>? byweekday;

  static RecurrenceRule? fromJson(Object? v) {
    if (v is! Map) return null;
    return RecurrenceRule(
      freq: v['freq'] as String,
      interval: (v['interval'] as num?)?.toInt() ?? 1,
      byweekday: v['byweekday'] == null ? null : List<int>.from(v['byweekday'] as List),
    );
  }

  Map<String, Object?> toJson() => {
        'freq': freq,
        'interval': interval,
        if (byweekday != null) 'byweekday': byweekday,
      };
}

class Category {
  Category({
    required this.id,
    required this.userId,
    required this.name,
    required this.color,
    this.icon,
    required this.isDefault,
    required this.sortOrder,
  });
  final String id, userId, name, color;
  final String? icon;
  final bool isDefault;
  final int sortOrder;

  factory Category.fromRow(Map<String, Object?> r) => Category(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        color: r['color'] as String,
        icon: r['icon'] as String?,
        isDefault: r['is_default'] == 1 || r['is_default'] == true,
        sortOrder: (r['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class CalendarInfo {
  CalendarInfo({
    required this.id,
    required this.userId,
    required this.name,
    required this.color,
    required this.isDefault,
  });
  final String id, userId, name, color;
  final bool isDefault;

  factory CalendarInfo.fromRow(Map<String, Object?> r) => CalendarInfo(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        color: r['color'] as String,
        isDefault: r['is_default'] == 1 || r['is_default'] == true,
      );
}

class Task {
  Task({
    required this.id,
    required this.userId,
    this.categoryId,
    required this.title,
    this.description,
    this.dueDate,
    this.dueTime,
    required this.priority,
    required this.status,
    this.estimatedDurationMinutes,
    this.actualDurationMinutes,
    this.recurrenceRule,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id, userId, title, priority, status, createdAt, updatedAt;
  final String? categoryId, description, dueDate, dueTime, completedAt;
  final int? estimatedDurationMinutes, actualDurationMinutes;
  final RecurrenceRule? recurrenceRule;

  bool get isPending => status == 'pending';
  bool get isCompleted => status == 'completed';

  factory Task.fromRow(Map<String, Object?> r) => Task(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        categoryId: r['category_id'] as String?,
        title: r['title'] as String,
        description: r['description'] as String?,
        dueDate: r['due_date'] as String?,
        dueTime: normalizeTime(r['due_time']),
        priority: r['priority'] as String,
        status: r['status'] as String,
        estimatedDurationMinutes: (r['estimated_duration_minutes'] as num?)?.toInt(),
        actualDurationMinutes: (r['actual_duration_minutes'] as num?)?.toInt(),
        recurrenceRule: RecurrenceRule.fromJson(r['recurrence_rule']),
        completedAt: r['completed_at'] as String?,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Note {
  Note({
    required this.id,
    required this.userId,
    this.categoryId,
    this.title,
    required this.content,
    required this.tags,
    required this.isPinned,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, content, createdAt, updatedAt;
  final String? categoryId, title;
  final List<String> tags;
  final bool isPinned;

  factory Note.fromRow(Map<String, Object?> r) => Note(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        categoryId: r['category_id'] as String?,
        title: r['title'] as String?,
        content: r['content'] as String,
        tags: _list<String>(r['tags']),
        isPinned: r['is_pinned'] == true,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Habit {
  Habit({
    required this.id,
    required this.userId,
    this.categoryId,
    required this.name,
    required this.frequency,
    this.daysOfWeek,
    required this.completedDates,
    required this.archived,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, name, frequency, createdAt, updatedAt;
  final String? categoryId;

  /// 0=Sun..6=Sat; null means any day counts (weekly only).
  final List<int>? daysOfWeek;
  final List<String> completedDates;
  final bool archived;

  factory Habit.fromRow(Map<String, Object?> r) => Habit(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        categoryId: r['category_id'] as String?,
        name: r['name'] as String,
        frequency: r['frequency'] as String,
        daysOfWeek: r['days_of_week'] == null ? null : List<int>.from(r['days_of_week'] as List),
        completedDates: _list<String>(r['completed_dates']),
        archived: r['archived'] == true,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class ShoppingItem {
  ShoppingItem({
    required this.id,
    required this.name,
    this.quantity,
    this.estimatedCost,
    this.isCompleted = false,
    this.store,
  });
  final String id, name;
  final String? quantity, store;
  final double? estimatedCost;
  final bool isCompleted;

  ShoppingItem toggled() => ShoppingItem(
        id: id,
        name: name,
        quantity: quantity,
        estimatedCost: estimatedCost,
        isCompleted: !isCompleted,
        store: store,
      );

  factory ShoppingItem.fromJson(Map<String, Object?> j) => ShoppingItem(
        id: j['id'] as String,
        name: j['name'] as String,
        quantity: j['quantity'] as String?,
        estimatedCost: (j['estimatedCost'] as num?)?.toDouble(),
        isCompleted: j['isCompleted'] == true,
        store: j['store'] as String?,
      );

  Map<String, Object?> toJson() => {
        'id': id,
        'name': name,
        'quantity': quantity,
        'estimatedCost': estimatedCost,
        'isCompleted': isCompleted,
        'store': store,
      };
}

class ShoppingList {
  ShoppingList({
    required this.id,
    required this.userId,
    required this.name,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, name, createdAt, updatedAt;
  final List<ShoppingItem> items;

  factory ShoppingList.fromRow(Map<String, Object?> r) => ShoppingList(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        items: ((r['items'] as List?) ?? const [])
            .map((e) => ShoppingItem.fromJson(Map<String, Object?>.from(e as Map)))
            .toList(),
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Expense {
  Expense({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.currency,
    required this.category,
    required this.date,
    this.paymentMethod,
    this.notes,
    this.recurrenceRule,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, type, currency, category, date, createdAt, updatedAt;
  final double amount;
  final String? paymentMethod, notes;
  final RecurrenceRule? recurrenceRule;

  bool get isIncome => type == 'income';

  factory Expense.fromRow(Map<String, Object?> r) => Expense(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        type: r['type'] as String,
        amount: _num(r['amount']),
        currency: r['currency'] as String,
        category: r['category'] as String,
        date: r['date'] as String,
        paymentMethod: r['payment_method'] as String?,
        notes: r['notes'] as String?,
        recurrenceRule: RecurrenceRule.fromJson(r['recurrence_rule']),
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Bill {
  Bill({
    required this.id,
    required this.userId,
    required this.name,
    required this.amount,
    required this.currency,
    required this.category,
    required this.dueDate,
    this.paymentMethod,
    this.notes,
    this.recurrenceRule,
    required this.status,
    this.paidAt,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, name, currency, category, dueDate, status, createdAt, updatedAt;
  final double amount;
  final String? paymentMethod, notes, paidAt;
  final RecurrenceRule? recurrenceRule;

  bool get isUnpaid => status == 'unpaid';

  factory Bill.fromRow(Map<String, Object?> r) => Bill(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        amount: _num(r['amount']),
        currency: r['currency'] as String,
        category: r['category'] as String,
        dueDate: r['due_date'] as String,
        paymentMethod: r['payment_method'] as String?,
        notes: r['notes'] as String?,
        recurrenceRule: RecurrenceRule.fromJson(r['recurrence_rule']),
        status: r['status'] as String,
        paidAt: r['paid_at'] as String?,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class CalendarEvent {
  CalendarEvent({
    required this.id,
    required this.userId,
    required this.calendarId,
    required this.title,
    this.location,
    this.description,
    required this.startAt,
    required this.endAt,
    required this.allDay,
    this.recurrenceRule,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, calendarId, title, createdAt, updatedAt;
  final String? location, description;
  final DateTime startAt, endAt;
  final bool allDay;
  final RecurrenceRule? recurrenceRule;

  factory CalendarEvent.fromRow(Map<String, Object?> r) => CalendarEvent(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        calendarId: r['calendar_id'] as String,
        title: r['title'] as String,
        location: r['location'] as String?,
        description: r['description'] as String?,
        startAt: _dt(r['start_at']).toLocal(),
        endAt: _dt(r['end_at']).toLocal(),
        allDay: r['all_day'] == true,
        recurrenceRule: RecurrenceRule.fromJson(r['recurrence_rule']),
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Subject {
  Subject({
    required this.id,
    required this.userId,
    required this.name,
    required this.color,
    this.instructor,
    this.term,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, name, color, createdAt, updatedAt;
  final String? instructor, term;

  factory Subject.fromRow(Map<String, Object?> r) => Subject(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        color: r['color'] as String,
        instructor: r['instructor'] as String?,
        term: r['term'] as String?,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class Assignment {
  Assignment({
    required this.id,
    required this.userId,
    required this.subjectId,
    required this.kind,
    required this.title,
    this.dueDate,
    this.dueTime,
    this.notes,
    required this.status,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, subjectId, kind, title, status, createdAt, updatedAt;
  final String? dueDate, dueTime, notes, completedAt;

  bool get isCompleted => status == 'completed';

  factory Assignment.fromRow(Map<String, Object?> r) => Assignment(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        subjectId: r['subject_id'] as String,
        kind: r['kind'] as String,
        title: r['title'] as String,
        dueDate: r['due_date'] as String?,
        dueTime: normalizeTime(r['due_time']),
        notes: r['notes'] as String?,
        status: r['status'] as String,
        completedAt: r['completed_at'] as String?,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

class AnchorDocument {
  AnchorDocument({
    required this.id,
    required this.userId,
    required this.name,
    required this.category,
    required this.storagePath,
    required this.fileName,
    this.mimeType,
    this.fileSize,
    this.issueDate,
    this.expirationDate,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id, userId, name, category, storagePath, fileName, createdAt, updatedAt;
  final String? mimeType, issueDate, expirationDate, notes;
  final int? fileSize;

  factory AnchorDocument.fromRow(Map<String, Object?> r) => AnchorDocument(
        id: r['id'] as String,
        userId: r['user_id'] as String,
        name: r['name'] as String,
        category: r['category'] as String,
        storagePath: r['storage_path'] as String,
        fileName: r['file_name'] as String,
        mimeType: r['mime_type'] as String?,
        fileSize: (r['file_size'] as num?)?.toInt(),
        issueDate: r['issue_date'] as String?,
        expirationDate: r['expiration_date'] as String?,
        notes: r['notes'] as String?,
        createdAt: r['created_at'] as String,
        updatedAt: r['updated_at'] as String,
      );
}

const moneyCategories = [
  'Food', 'Transportation', 'Bills', 'Shopping', 'Entertainment',
  'School', 'Health', 'Personal', 'Other',
];
const documentCategories = ['ID', 'School', 'Certificate', 'Contract', 'Other'];
const taskPriorities = ['low', 'medium', 'high', 'urgent'];
