import 'dart:math';

import '../models/models.dart';
import '../utils/dates.dart';

// ============================================================================
// Task prioritization (deterministic, no AI): deadline urgency + declared
// priority + overdue status combined into one score.
// ============================================================================

const _priorityWeight = {'low': 1, 'medium': 2, 'high': 3, 'urgent': 4};

bool isOverdue(String? dueDate, String? dueTime, String status, [DateTime? now]) {
  if (dueDate == null || status != 'pending') return false;
  return dueDateTime(dueDate, dueTime).isBefore(now ?? DateTime.now());
}

double computeTaskScore(Task task, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  if (!task.isPending) return double.negativeInfinity;

  var score = (_priorityWeight[task.priority] ?? 2) * 10.0;
  if (task.dueDate != null) {
    final due = dueDateTime(task.dueDate!, task.dueTime);
    final hours = due.difference(now).inMilliseconds / (1000 * 60 * 60);
    if (hours < 0) {
      // Overdue ranks above everything; grows with lateness but is capped so a
      // months-old task doesn't bury everything forever.
      score += 50 + min(-hours / 24, 14);
    } else if (hours <= 24) {
      score += 30 - hours / 24;
    } else if (hours <= 24 * 7) {
      score += 10;
    }
  }
  return score;
}

List<Task> sortTasksByPriority(List<Task> tasks, [DateTime? now]) {
  final pending = tasks.where((t) => t.isPending).toList();
  pending.sort((a, b) => computeTaskScore(b, now).compareTo(computeTaskScore(a, now)));
  return pending;
}

List<Task> selectTodayTasks(List<Task> tasks, {int limit = 5, DateTime? now}) =>
    sortTasksByPriority(tasks, now).take(limit).toList();

String formatDueLabel(String dueDate, String? dueTime, String status) {
  final due = dueDateTime(dueDate, dueTime);
  final now = DateTime.now();
  final tomorrow = now.add(const Duration(days: 1));

  final String dateLabel = isSameDay(due, now)
      ? 'Today'
      : isSameDay(due, tomorrow)
          ? 'Tomorrow'
          : formatShortDate(due);
  final prefix = (status == 'pending' && due.isBefore(now)) ? 'Overdue · ' : '';
  return dueTime != null ? '$prefix$dateLabel · ${formatTime(due)}' : '$prefix$dateLabel';
}

// ============================================================================
// Recurrence: next occurrence is generated lazily on completion.
// ============================================================================

DateTime _addMonths(DateTime d, int months) {
  var next = DateTime(d.year, d.month + months, d.day);
  // Month-end overflow guard: Jan 31 + 1 month -> Feb 28/29, not March.
  if (next.day != d.day) next = DateTime(next.year, next.month, 0);
  return next;
}

String computeNextDueDate(String currentDueDate, RecurrenceRule rule) {
  final current = parseDateKey(currentDueDate);
  DateTime plus(int days) => DateTime(current.year, current.month, current.day + days);

  switch (rule.freq) {
    case 'daily':
      return toDateKey(plus(rule.interval));
    case 'weekly':
      final days = rule.byweekday;
      if (days != null && days.isNotEmpty) {
        final sorted = [...days]..sort();
        // Dart: Monday=1..Sunday=7 -> convert to Sunday=0..Saturday=6.
        final dow = current.weekday % 7;
        final nextThisWeek = sorted.where((d) => d > dow).firstOrNull;
        if (nextThisWeek != null) return toDateKey(plus(nextThisWeek - dow));
        return toDateKey(plus(7 * rule.interval - dow + sorted.first));
      }
      return toDateKey(plus(7 * rule.interval));
    case 'monthly':
      return toDateKey(_addMonths(current, rule.interval));
    case 'yearly':
      return toDateKey(_addMonths(current, 12 * rule.interval));
    default:
      return toDateKey(plus(1));
  }
}

// ============================================================================
// Calendar
// ============================================================================

class CalendarCell {
  const CalendarCell(this.date, this.isCurrentMonth);
  final DateTime date;
  final bool isCurrentMonth;
}

/// Fixed 6-week (42-cell) grid, Sunday-first.
List<CalendarCell> buildMonthGrid(int year, int month) {
  final first = DateTime(year, month, 1);
  final startDow = first.weekday % 7; // Sunday = 0
  final daysInMonth = DateTime(year, month + 1, 0).day;
  final daysInPrev = DateTime(year, month, 0).day;

  final cells = <CalendarCell>[];
  for (var i = startDow - 1; i >= 0; i--) {
    cells.add(CalendarCell(DateTime(year, month - 1, daysInPrev - i), false));
  }
  for (var d = 1; d <= daysInMonth; d++) {
    cells.add(CalendarCell(DateTime(year, month, d), true));
  }
  var trailing = 1;
  while (cells.length < 42) {
    cells.add(CalendarCell(DateTime(year, month + 1, trailing++), false));
  }
  return cells;
}

class AgendaItem {
  const AgendaItem.event(this.event) : task = null;
  const AgendaItem.task(this.task) : event = null;
  final CalendarEvent? event;
  final Task? task;

  DateTime get time => event != null
      ? event!.startAt
      : (task!.dueTime != null
          ? dueDateTime(task!.dueDate!, task!.dueTime)
          : parseDateKey(task!.dueDate!));
}

List<Task> tasksForDate(List<Task> tasks, DateTime date) => tasks
    .where((t) => t.dueDate != null && isSameDay(parseDateKey(t.dueDate!), date))
    .toList();

List<CalendarEvent> eventsForDate(List<CalendarEvent> events, DateTime date) {
  final start = dateOnly(date);
  final end = start.add(const Duration(days: 1));
  return events.where((e) => e.startAt.isBefore(end) && e.endAt.isAfter(start)).toList();
}

List<AgendaItem> buildAgenda(List<Task> tasks, List<CalendarEvent> events, DateTime date) {
  final items = <AgendaItem>[
    ...eventsForDate(events, date).map(AgendaItem.event),
    ...tasksForDate(tasks, date).map(AgendaItem.task),
  ];
  items.sort((a, b) => a.time.compareTo(b.time));
  return items;
}

/// Events overlapping [start, end), excluding [excludeId] (editing itself).
List<CalendarEvent> findOverlappingEvents(
    DateTime start, DateTime end, List<CalendarEvent> existing, {String? excludeId}) {
  return existing
      .where((e) => e.id != excludeId && start.isBefore(e.endAt) && e.startAt.isBefore(end))
      .toList();
}

// ============================================================================
// Habits
// ============================================================================

bool isCompletedToday(Habit h, [DateTime? now]) =>
    h.completedDates.contains(toDateKey(now ?? DateTime.now()));

bool isDueToday(Habit h, [DateTime? now]) {
  if (h.frequency == 'daily') return true;
  if (h.daysOfWeek == null || h.daysOfWeek!.isEmpty) return true;
  return h.daysOfWeek!.contains((now ?? DateTime.now()).weekday % 7);
}

/// Daily: consecutive days ending today or yesterday (a streak isn't broken
/// just because today hasn't happened yet). Weekly: consecutive Sun-Sat
/// weeks with at least one completion, same not-broken-yet rule.
int computeStreak(Habit h, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final done = h.completedDates.toSet();
  if (done.isEmpty) return 0;

  if (h.frequency == 'daily') {
    var streak = 0;
    var cursor = dateOnly(now);
    if (!done.contains(toDateKey(cursor))) cursor = cursor.subtract(const Duration(days: 1));
    while (done.contains(toDateKey(cursor))) {
      streak++;
      cursor = DateTime(cursor.year, cursor.month, cursor.day - 1);
    }
    return streak;
  }

  bool weekHas(DateTime start) => List.generate(7, (i) => DateTime(start.year, start.month, start.day + i))
      .any((d) => done.contains(toDateKey(d)));

  var streak = 0;
  var cursor = dateOnly(now);
  cursor = DateTime(cursor.year, cursor.month, cursor.day - (cursor.weekday % 7));
  if (!weekHas(cursor)) cursor = DateTime(cursor.year, cursor.month, cursor.day - 7);
  while (weekHas(cursor)) {
    streak++;
    cursor = DateTime(cursor.year, cursor.month, cursor.day - 7);
  }
  return streak;
}

double computeHabitConsistency(Habit h, {int windowDays = 30, DateTime? now}) {
  final n = now ?? DateTime.now();
  final done = h.completedDates.toSet();
  var due = 0, hit = 0;
  for (var i = 0; i < windowDays; i++) {
    final d = DateTime(n.year, n.month, n.day - i);
    final isDue = h.frequency == 'daily' ||
        h.daysOfWeek == null ||
        h.daysOfWeek!.isEmpty ||
        h.daysOfWeek!.contains(d.weekday % 7);
    if (!isDue) continue;
    due++;
    if (done.contains(toDateKey(d))) hit++;
  }
  return due > 0 ? hit / due : 0;
}

// ============================================================================
// Money
// ============================================================================

double _round2(double v) => (v * 100).round() / 100;

bool isInMonth(String dateStr, int year, int month) {
  final p = dateStr.split('-').map(int.parse).toList();
  return p[0] == year && p[1] - 1 == month;
}

class MonthlySummary {
  const MonthlySummary(this.income, this.expenses, this.remaining);
  final double income, expenses, remaining;
}

MonthlySummary computeMonthlySummary(List<Expense> items, [DateTime? now]) {
  final n = now ?? DateTime.now();
  double income = 0, spent = 0;
  for (final e in items) {
    if (!isInMonth(e.date, n.year, n.month - 1)) continue;
    e.isIncome ? income += e.amount : spent += e.amount;
  }
  return MonthlySummary(_round2(income), _round2(spent), _round2(income - spent));
}

List<MapEntry<String, double>> computeCategoryTotals(List<Expense> items, [DateTime? now]) {
  final n = now ?? DateTime.now();
  final totals = <String, double>{};
  for (final e in items) {
    if (e.isIncome || !isInMonth(e.date, n.year, n.month - 1)) continue;
    totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  }
  final list = totals.entries.map((e) => MapEntry(e.key, _round2(e.value))).toList();
  list.sort((a, b) => b.value.compareTo(a.value));
  return list;
}

// ============================================================================
// Documents
// ============================================================================

int daysUntil(String dateStr, [DateTime? now]) {
  final n = now ?? DateTime.now();
  final t = parseDateKey(dateStr);
  // UTC dates avoid DST-length days skewing the whole-day difference.
  return DateTime.utc(t.year, t.month, t.day).difference(DateTime.utc(n.year, n.month, n.day)).inDays;
}

/// expired | soon | ok | none
String expirationStatus(String? expirationDate, [DateTime? now]) {
  if (expirationDate == null) return 'none';
  final days = daysUntil(expirationDate, now);
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}

String? formatExpirationLabel(String? expirationDate, [DateTime? now]) {
  if (expirationDate == null) return null;
  final days = daysUntil(expirationDate, now);
  if (days < 0) return 'Expired ${-days} ${-days == 1 ? 'day' : 'days'} ago';
  if (days == 0) return 'Expires today';
  return 'Expires in $days ${days == 1 ? 'day' : 'days'}';
}

// ============================================================================
// Insights
// ============================================================================

class DailyBriefing {
  const DailyBriefing({
    required this.importantTaskCount,
    required this.appointmentCount,
    required this.upcomingBillCount,
    required this.habitCount,
    required this.mostImportantTask,
    required this.estimatedWorkloadMinutes,
  });
  final int importantTaskCount, appointmentCount, upcomingBillCount, habitCount, estimatedWorkloadMinutes;
  final Task? mostImportantTask;
}

DailyBriefing computeDailyBriefing(
    List<Task> tasks, List<CalendarEvent> events, List<Bill> bills, List<Habit> habits,
    [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final todayKey = toDateKey(now);
  final important = selectTodayTasks(tasks, limit: 10, now: now);
  final todaysEvents = events.where((e) => toDateKey(e.startAt) == todayKey).length;
  final lookahead = toDateKey(DateTime(now.year, now.month, now.day + 3));
  final upcomingBills = bills
      .where((b) => b.isUnpaid && b.dueDate.compareTo(todayKey) >= 0 && b.dueDate.compareTo(lookahead) <= 0)
      .length;

  return DailyBriefing(
    importantTaskCount: important.length,
    appointmentCount: todaysEvents,
    upcomingBillCount: upcomingBills,
    habitCount: habits.where((h) => isDueToday(h, now)).length,
    mostImportantTask: important.firstOrNull,
    estimatedWorkloadMinutes:
        important.fold(0, (sum, t) => sum + (t.estimatedDurationMinutes ?? 0)),
  );
}

class EveningReview {
  const EveningReview(this.tasksCompletedToday, this.habitsCompletedToday, this.stillPendingCount, this.tomorrowCount);
  final int tasksCompletedToday, habitsCompletedToday, stillPendingCount, tomorrowCount;
}

EveningReview computeEveningReview(List<Task> tasks, List<Habit> habits, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final todayKey = toDateKey(now);
  final tomorrowKey = toDateKey(DateTime(now.year, now.month, now.day + 1));

  return EveningReview(
    tasks.where((t) => t.isCompleted && t.completedAt != null && toDateKey(DateTime.parse(t.completedAt!).toLocal()) == todayKey).length,
    habits.where((h) => h.completedDates.contains(todayKey)).length,
    tasks.where((t) => t.isPending && t.dueDate != null && t.dueDate!.compareTo(todayKey) <= 0).length,
    tasks.where((t) => t.isPending && t.dueDate == tomorrowKey).length,
  );
}

class FreeSlot {
  const FreeSlot(this.start, this.end, this.minutes);
  final DateTime start, end;
  final int minutes;
}

/// Free gaps in today's schedule between now and 9pm (8am-9pm day).
List<FreeSlot> findFreeSlotsToday(List<CalendarEvent> events, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final dayStart = DateTime(now.year, now.month, now.day, 8);
  final dayEnd = DateTime(now.year, now.month, now.day, 21);
  final windowStart = now.isAfter(dayStart) ? now : dayStart;
  if (!windowStart.isBefore(dayEnd)) return [];

  final todays = events
      .where((e) => !e.allDay && e.endAt.isAfter(windowStart) && e.startAt.isBefore(dayEnd))
      .toList()
    ..sort((a, b) => a.startAt.compareTo(b.startAt));

  final slots = <FreeSlot>[];
  var cursor = windowStart;
  for (final e in todays) {
    if (e.startAt.isAfter(cursor)) {
      final m = (e.startAt.difference(cursor).inSeconds / 60).round();
      if (m > 0) slots.add(FreeSlot(cursor, e.startAt, m));
    }
    if (e.endAt.isAfter(cursor)) cursor = e.endAt;
  }
  if (cursor.isBefore(dayEnd)) {
    final m = (dayEnd.difference(cursor).inSeconds / 60).round();
    if (m > 0) slots.add(FreeSlot(cursor, dayEnd, m));
  }
  return slots;
}

class FreeTimeSuggestion {
  const FreeTimeSuggestion(this.slot, this.task);
  final FreeSlot slot;
  final Task task;
}

/// Largest free slot today (30+ min) and the longest pending task that fits.
FreeTimeSuggestion? suggestTaskForFreeTime(List<Task> tasks, List<CalendarEvent> events, [DateTime? now]) {
  final slots = findFreeSlotsToday(events, now).where((s) => s.minutes >= 30).toList();
  if (slots.isEmpty) return null;
  final largest = slots.reduce((b, s) => s.minutes > b.minutes ? s : b);

  final candidates = tasks
      .where((t) =>
          t.isPending &&
          (t.estimatedDurationMinutes ?? 0) > 0 &&
          t.estimatedDurationMinutes! <= largest.minutes)
      .toList()
    ..sort((a, b) => b.estimatedDurationMinutes!.compareTo(a.estimatedDurationMinutes!));
  return candidates.isEmpty ? null : FreeTimeSuggestion(largest, candidates.first);
}

class ProductivityStats {
  const ProductivityStats(this.completedCount, this.totalCount, this.completionRate, this.overdueCount, this.averageCompletionHours);
  final int completedCount, totalCount, overdueCount;
  final double completionRate;
  final double? averageCompletionHours;
}

ProductivityStats computeProductivityStats(List<Task> tasks, [DateTime? now]) {
  final relevant = tasks.where((t) => t.status != 'cancelled').toList();
  final completed = relevant.where((t) => t.isCompleted).toList();
  final overdue = relevant.where((t) => isOverdue(t.dueDate, t.dueTime, t.status, now)).length;

  final hours = completed
      .where((t) => t.completedAt != null)
      .map((t) => DateTime.parse(t.completedAt!).difference(DateTime.parse(t.createdAt)).inMilliseconds / 3600000)
      .toList();

  return ProductivityStats(
    completed.length,
    relevant.length,
    relevant.isEmpty ? 0 : completed.length / relevant.length,
    overdue,
    hours.isEmpty ? null : hours.reduce((a, b) => a + b) / hours.length,
  );
}

class DayWorkload {
  const DayWorkload(this.date, this.taskCount, this.eventCount, this.estimatedMinutes);
  final String date;
  final int taskCount, eventCount, estimatedMinutes;
}

List<DayWorkload> computeWorkloadByDay(List<Task> tasks, List<CalendarEvent> events, {int days = 7, DateTime? now}) {
  final n = now ?? DateTime.now();
  return List.generate(days, (i) {
    final key = toDateKey(DateTime(n.year, n.month, n.day + i));
    final dayTasks = tasks.where((t) => t.isPending && t.dueDate == key).toList();
    return DayWorkload(
      key,
      dayTasks.length,
      events.where((e) => toDateKey(e.startAt) == key).length,
      dayTasks.fold(0, (s, t) => s + (t.estimatedDurationMinutes ?? 0)),
    );
  });
}

List<MapEntry<String?, int>> computeCategoryDistribution(List<Task> tasks) {
  final counts = <String?, int>{};
  for (final t in tasks) {
    if (t.status == 'cancelled') continue;
    counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
  }
  final list = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
  return list;
}

// ============================================================================
// Rule-based planning (replaces the old LLM daily plan / weekly review)
// ============================================================================

class DailyPlanResult {
  const DailyPlanResult(this.summary, this.focusTaskId);
  final String summary;
  final String? focusTaskId;
}

DailyPlanResult computeDailyPlan(List<Task> tasks, List<CalendarEvent> events, List<Habit> habits, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final todayKey = toDateKey(now);
  final pendingToday = tasks.where((t) => t.isPending && t.dueDate == todayKey).toList();
  final eventsToday = events.where((e) => toDateKey(e.startAt) == todayKey).toList();
  final habitsDue = habits.where((h) => isDueToday(h, now) && !h.completedDates.contains(todayKey)).toList();

  if (pendingToday.isEmpty && eventsToday.isEmpty && habitsDue.isEmpty) {
    return const DailyPlanResult(
        'Nothing on the calendar or due today - a good day to get ahead on something.', null);
  }

  final focus = selectTodayTasks(pendingToday, limit: 1, now: now).firstOrNull;
  final extras = <String>[
    if (eventsToday.isNotEmpty) '${eventsToday.length} event${eventsToday.length == 1 ? '' : 's'}',
    if (habitsDue.isNotEmpty) '${habitsDue.length} habit${habitsDue.length == 1 ? '' : 's'} to check off',
  ];

  final summary = focus != null
      ? (extras.isNotEmpty
          ? 'Focus on "${focus.title}" first - you also have ${extras.join(' and ')} today.'
          : 'Focus on "${focus.title}" first - nothing else urgent today.')
      : 'Today you have ${extras.join(' and ')}.';
  return DailyPlanResult(summary, focus?.id);
}

String computeWeeklyReview(List<Task> tasks, List<Habit> habits, List<Expense> expenses, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  final weekStartKey = toDateKey(now.subtract(const Duration(days: 7)));
  final todayKey = toDateKey(now);

  final completed = tasks.where((t) =>
      t.isCompleted && t.completedAt != null && toDateKey(DateTime.parse(t.completedAt!).toLocal()).compareTo(weekStartKey) >= 0).length;
  final overdue = tasks.where((t) => t.isPending && t.dueDate != null && t.dueDate!.compareTo(todayKey) < 0).length;
  final checkIns = habits.fold<int>(0, (s, h) => s + h.completedDates.where((d) => d.compareTo(weekStartKey) >= 0).length);
  final weekExpenses = expenses.where((e) => !e.isIncome && e.date.compareTo(weekStartKey) >= 0).toList();
  final spent = weekExpenses.fold<double>(0, (s, e) => s + e.amount);

  final lines = <String>[
    if (completed > 0) 'completed $completed task${completed == 1 ? '' : 's'}',
    if (checkIns > 0) 'checked off $checkIns habit${checkIns == 1 ? '' : 's'}',
    if (weekExpenses.isNotEmpty)
      'spent ${weekExpenses.first.currency} ${spent.toStringAsFixed(2)} across ${weekExpenses.length} expense${weekExpenses.length == 1 ? '' : 's'}',
  ];

  if (lines.isEmpty && overdue == 0) {
    return 'A quiet week - nothing tracked yet. Start small: add one task, one habit, or one expense.';
  }
  var summary = lines.isNotEmpty ? 'This week you ${lines.join(', ')}.' : 'A quiet week on the tracked fronts.';
  if (overdue > 0) summary += ' $overdue task${overdue == 1 ? '' : 's'} still overdue.';
  return summary;
}

// ============================================================================
// Brain dump: one task per line, category guessed by keyword.
// ============================================================================

class BrainDumpItem {
  BrainDumpItem(this.title, this.categoryName);
  final String title, categoryName;
}

const _keywordHints = [
  (['pay', 'bill', 'rent', 'invoice', 'budget', 'expense'], ['money', 'finance', 'bill']),
  (['call', 'email', 'meet', 'meeting', 'project', 'report', 'client'], ['work']),
  (['study', 'homework', 'assignment', 'exam', 'class', 'school'], ['school', 'student']),
  (['doctor', 'gym', 'workout', 'medicine', 'appointment'], ['health']),
  (['clean', 'grocery', 'groceries', 'laundry', 'repair', 'fix'], ['home']),
  (['birthday', 'gift', 'family', 'friend'], ['family', 'social', 'personal']),
];

String _categoryForLine(String line, List<Category> categories) {
  final lower = line.toLowerCase();
  final fallback = categories.where((c) => c.isDefault).firstOrNull?.name ??
      categories.firstOrNull?.name ??
      'Other';
  for (final (keywords, nameHints) in _keywordHints) {
    if (!keywords.any(lower.contains)) continue;
    final match = categories
        .where((c) => nameHints.any((h) => c.name.toLowerCase().contains(h)))
        .firstOrNull;
    if (match != null) return match.name;
  }
  return fallback;
}

List<BrainDumpItem> parseBrainDumpText(String text, List<Category> categories) => text
    .split('\n')
    .map((l) => l.trim())
    .where((l) => l.isNotEmpty)
    .map((l) => BrainDumpItem(l, _categoryForLine(l, categories)))
    .toList();

// ============================================================================
// Quick-add parser (offline, no AI)
// ============================================================================

class QuickAddResult {
  const QuickAddResult(this.type, this.title, this.dueDate, this.dueTime, this.amount);
  final String type; // task | event | bill
  final String title;
  final String? dueDate, dueTime;
  final double? amount;
}

const _weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

QuickAddResult parseQuickAdd(String raw, [DateTime? nowArg]) {
  final now = nowArg ?? DateTime.now();
  var text = raw.trim();
  String? dueDate, dueTime;
  double? amount;

  String strip(RegExpMatch m) => text.replaceFirst(m.group(0)!, ' ').trim();
  DateTime plusDays(int n) => DateTime(now.year, now.month, now.day + n);

  final amountMatch = RegExp(r'[₱$€£]\s?([\d,]+(?:\.\d{1,2})?)').firstMatch(text) ??
      RegExp(r'\b([\d,]+(?:\.\d{1,2})?)\s?(?:pesos|dollars|php|usd)\b', caseSensitive: false).firstMatch(text);
  if (amountMatch != null) {
    amount = double.parse(amountMatch.group(1)!.replaceAll(',', ''));
    text = strip(amountMatch);
  }

  final timeMatch = RegExp(r'\b(\d{1,2})(:(\d{2}))?\s?(am|pm)\b', caseSensitive: false).firstMatch(text);
  if (timeMatch != null) {
    var hour = int.parse(timeMatch.group(1)!);
    final minute = timeMatch.group(3) != null ? int.parse(timeMatch.group(3)!) : 0;
    final mer = timeMatch.group(4)!.toLowerCase();
    if (mer == 'pm' && hour != 12) hour += 12;
    if (mer == 'am' && hour == 12) hour = 0;
    dueTime = '${pad2(hour)}:${pad2(minute)}';
    text = strip(timeMatch).replaceFirst(RegExp(r'\bat\b', caseSensitive: false), ' ').trim();
  }

  RegExpMatch? m;
  if ((m = RegExp(r'\btoday\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(now);
    text = strip(m!);
  } else if ((m = RegExp(r'\btomorrow\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(plusDays(1));
    text = strip(m!);
  } else if ((m = RegExp(r'\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b', caseSensitive: false).firstMatch(text)) != null) {
    // "Next Friday" said on a Wednesday means the coming Friday; "next" only
    // pushes a week out when today already is that weekday.
    final isNext = m!.group(1) != null;
    final target = _weekdays.indexOf(m.group(2)!.toLowerCase());
    var diff = (target - (now.weekday % 7) + 7) % 7;
    if (diff == 0 && isNext) diff = 7;
    dueDate = toDateKey(plusDays(diff));
    text = strip(m);
  } else if ((m = RegExp(r'\bin\s+(\d+)\s+days?\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(plusDays(int.parse(m!.group(1)!)));
    text = strip(m);
  } else if ((m = RegExp(r'\bin\s+(\d+)\s+weeks?\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(plusDays(int.parse(m!.group(1)!) * 7));
    text = strip(m);
  } else if ((m = RegExp(r'\bnext week\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(plusDays(7));
    text = strip(m!);
  } else if ((m = RegExp(r'\bnext month\b', caseSensitive: false).firstMatch(text)) != null) {
    dueDate = toDateKey(DateTime(now.year, now.month + 1, now.day));
    text = strip(m!);
  }

  text = text
      .replaceAll(RegExp(r'\bdue\b', caseSensitive: false), ' ')
      .replaceAll(RegExp(r'\s{2,}'), ' ')
      .replaceAll(RegExp(r'^[\s,.-]+|[\s,.-]+$'), '')
      .trim();

  final type = amount != null ? 'bill' : (dueTime != null ? 'event' : 'task');
  return QuickAddResult(type, text.isEmpty ? raw.trim() : text, dueDate, dueTime, amount);
}
