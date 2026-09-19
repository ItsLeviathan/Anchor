import 'package:intl/intl.dart';

String pad2(int n) => n.toString().padLeft(2, '0');

/// 'YYYY-MM-DD' in local time.
String toDateKey(DateTime d) => '${d.year}-${pad2(d.month)}-${pad2(d.day)}';

DateTime parseDateKey(String key) {
  final p = key.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2]);
}

DateTime dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

bool isSameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

/// Combines 'YYYY-MM-DD' and an optional 'HH:MM' into a local DateTime.
DateTime dueDateTime(String dueDate, String? dueTime, [String fallback = '23:59']) {
  final d = parseDateKey(dueDate);
  final t = (dueTime ?? fallback).split(':').map(int.parse).toList();
  return DateTime(d.year, d.month, d.day, t[0], t[1]);
}

/// Postgres `time` columns come back as 'HH:MM:SS'; the app works in 'HH:MM'.
String? normalizeTime(Object? v) {
  if (v == null) return null;
  final s = v.toString();
  return s.length >= 5 ? s.substring(0, 5) : s;
}

String formatTime(DateTime d) => DateFormat.jm().format(d);
String formatShortDate(DateTime d) => DateFormat('EEE, MMM d').format(d);
String formatLongDate(DateTime d) => DateFormat('EEEE, MMMM d').format(d);

String formatMoney(num amount, [String currency = 'PHP']) =>
    '$currency ${NumberFormat('#,##0.00').format(amount)}';

/// e.g. 135 -> "2h 15m".
String formatWorkload(int minutes) {
  if (minutes <= 0) return '';
  final h = minutes ~/ 60;
  final m = minutes % 60;
  if (h == 0) return '${m}m';
  if (m == 0) return '${h}h';
  return '${h}h ${m}m';
}
