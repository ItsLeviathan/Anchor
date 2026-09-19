import 'package:anchor/core/logic/logic.dart';
import 'package:anchor/core/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

Task task({
  String id = 't',
  String? dueDate,
  String? dueTime,
  String priority = 'medium',
  String status = 'pending',
}) =>
    Task(
      id: id,
      userId: 'u',
      title: id,
      dueDate: dueDate,
      dueTime: dueTime,
      priority: priority,
      status: status,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    );

Habit habit(List<String> dates, {String frequency = 'daily', List<int>? days}) => Habit(
      id: 'h',
      userId: 'u',
      name: 'h',
      frequency: frequency,
      daysOfWeek: days,
      completedDates: dates,
      archived: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    );

void main() {
  group('computeNextDueDate', () {
    test('daily adds the interval', () {
      expect(computeNextDueDate('2026-03-10', const RecurrenceRule(freq: 'daily', interval: 3)), '2026-03-13');
    });

    test('monthly clamps to the last day of a shorter month', () {
      expect(computeNextDueDate('2026-01-31', const RecurrenceRule(freq: 'monthly')), '2026-02-28');
    });

    test('yearly from a leap day lands on Feb 28 the next year', () {
      expect(computeNextDueDate('2028-02-29', const RecurrenceRule(freq: 'yearly')), '2029-02-28');
    });

    test('weekly with weekdays picks the next configured day, then wraps', () {
      // 2026-03-09 is a Monday (dow 1); Mon/Wed/Fri -> Wednesday.
      const rule = RecurrenceRule(freq: 'weekly', byweekday: [1, 3, 5]);
      expect(computeNextDueDate('2026-03-09', rule), '2026-03-11');
      // Friday wraps to next Monday.
      expect(computeNextDueDate('2026-03-13', rule), '2026-03-16');
    });
  });

  group('computeTaskScore', () {
    final now = DateTime(2026, 3, 10, 12);

    test('completed tasks never rank', () {
      expect(computeTaskScore(task(status: 'completed'), now), double.negativeInfinity);
    });

    test('at equal priority, overdue outranks due-soon (matches the RN scoring)', () {
      final overdue = task(dueDate: '2026-03-09');
      final soon = task(dueDate: '2026-03-10', dueTime: '18:00');
      expect(computeTaskScore(overdue, now), greaterThan(computeTaskScore(soon, now)));
    });

    test('overdue bonus is capped at 14 days', () {
      final veryOld = computeTaskScore(task(dueDate: '2025-01-01'), now);
      final twoWeeks = computeTaskScore(task(dueDate: '2026-02-24'), now);
      expect(veryOld - twoWeeks, lessThan(1)); // both at/near the cap
    });

    test('sortTasksByPriority drops non-pending and orders by score', () {
      final sorted = sortTasksByPriority([
        task(id: 'low', priority: 'low'),
        task(id: 'done', status: 'completed'),
        task(id: 'high', priority: 'high'),
      ], now);
      expect(sorted.map((t) => t.id), ['high', 'low']);
    });
  });

  group('computeStreak', () {
    final now = DateTime(2026, 3, 10, 9);

    test('a streak is not broken just because today has not happened yet', () {
      expect(computeStreak(habit(['2026-03-09', '2026-03-08', '2026-03-07']), now), 3);
    });

    test('counts today when it is done', () {
      expect(computeStreak(habit(['2026-03-10', '2026-03-09']), now), 2);
    });

    test('a two-day gap resets to zero', () {
      expect(computeStreak(habit(['2026-03-07']), now), 0);
    });

    test('weekly streak counts consecutive Sun-Sat weeks', () {
      // Week of Mar 8, Mar 1, Feb 22 each have one completion.
      expect(computeStreak(habit(['2026-03-09', '2026-03-03', '2026-02-24'], frequency: 'weekly'), now), 3);
    });
  });

  group('parseQuickAdd', () {
    final now = DateTime(2026, 3, 11, 10); // Wednesday

    test('extracts tomorrow and a time, and classifies as an event', () {
      final r = parseQuickAdd('Dentist tomorrow at 3pm', now);
      expect(r.type, 'event');
      expect(r.dueDate, '2026-03-12');
      expect(r.dueTime, '15:00');
      expect(r.title, 'Dentist');
    });

    test('a currency amount makes it a bill', () {
      final r = parseQuickAdd('Pay rent ₱5,000 next friday', now);
      expect(r.type, 'bill');
      expect(r.amount, 5000);
      expect(r.dueDate, '2026-03-13');
    });

    test('"next <weekday>" means the coming one unless today is that weekday', () {
      expect(parseQuickAdd('call mom next wednesday', now).dueDate, '2026-03-18');
      expect(parseQuickAdd('call mom thursday', now).dueDate, '2026-03-12');
    });

    test('plain text stays a task with no date', () {
      final r = parseQuickAdd('Buy groceries', now);
      expect(r.type, 'task');
      expect(r.dueDate, isNull);
      expect(r.title, 'Buy groceries');
    });
  });

  group('parseBrainDumpText', () {
    final cats = [
      Category(id: '1', userId: 'u', name: 'Personal', color: '#000000', isDefault: true, sortOrder: 0),
      Category(id: '2', userId: 'u', name: 'Work', color: '#000000', isDefault: false, sortOrder: 1),
    ];

    test('one task per non-empty line, categorized by keyword', () {
      final items = parseBrainDumpText('Email the client\n\n  Water plants ', cats);
      expect(items.map((i) => i.title), ['Email the client', 'Water plants']);
      expect(items[0].categoryName, 'Work');
      expect(items[1].categoryName, 'Personal'); // default fallback
    });
  });

  group('expiration', () {
    final now = DateTime(2026, 3, 10, 15);
    test('status thresholds', () {
      expect(expirationStatus(null, now), 'none');
      expect(expirationStatus('2026-03-09', now), 'expired');
      expect(expirationStatus('2026-04-01', now), 'soon');
      expect(expirationStatus('2026-06-01', now), 'ok');
    });

    test('labels', () {
      expect(formatExpirationLabel('2026-03-10', now), 'Expires today');
      expect(formatExpirationLabel('2026-03-24', now), 'Expires in 14 days');
      expect(formatExpirationLabel('2026-03-09', now), 'Expired 1 day ago');
    });
  });

  group('findFreeSlotsToday', () {
    CalendarEvent event(DateTime s, DateTime e) => CalendarEvent(
          id: 'e', userId: 'u', calendarId: 'c', title: 'e', startAt: s, endAt: e,
          allDay: false, createdAt: '', updatedAt: '',
        );

    test('carves gaps around events within 8am-9pm', () {
      final now = DateTime(2026, 3, 10, 7); // before the day starts
      final slots = findFreeSlotsToday([event(DateTime(2026, 3, 10, 10), DateTime(2026, 3, 10, 11))], now);
      expect(slots.map((s) => s.minutes), [120, 600]);
    });
  });
}
