import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../db/database.dart';
import '../models/models.dart';
import '../utils/dates.dart';

/// Local reminders: task due, event 15 min before, document expiry (-14d) and
/// bill due. Same semantics as the RN app: cancel-then-reschedule per entity,
/// and wipe-all when reminders are turned off.
const _eventLeadMinutes = 15;
const _defaultTaskReminderTime = '09:00';
const _documentLeadDays = 14;
const _morningReminderTime = '09:00';
const _remindersKey = 'reminders_enabled';

final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
bool _initialized = false;

/// FNV-1a (31-bit): deterministic across runs, unlike String.hashCode, so an
/// entity always maps to the same notification id.
int _notificationId(String type, String id) {
  var h = 0x811c9dc5;
  for (final c in '$type:$id'.codeUnits) {
    h ^= c;
    h = (h * 0x01000193) & 0xffffffff;
  }
  return h & 0x7fffffff;
}

Future<void> initNotifications() async {
  if (_initialized) return;
  tzdata.initializeTimeZones();
  try {
    final info = await FlutterTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(info.identifier));
  } catch (err) {
    debugPrint('Could not resolve local timezone, falling back to UTC: $err');
  }
  await _plugin.initialize(
    settings: const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    ),
  );
  _initialized = true;
}

/// Requests permission (only if not already determined). Safe to call often.
Future<bool> ensureNotificationPermission() async {
  await initNotifications();
  if (Platform.isAndroid) {
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (await android?.areNotificationsEnabled() ?? false) return true;
    return await android?.requestNotificationsPermission() ?? false;
  }
  if (Platform.isIOS) {
    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    return await ios?.requestPermissions(alert: true, badge: false, sound: true) ?? false;
  }
  return false;
}

Future<bool> areRemindersEnabled() async => (await getLocalSetting(_remindersKey)) != 'false';

Future<void> setRemindersEnabled(bool enabled) async {
  await setLocalSetting(_remindersKey, enabled ? 'true' : 'false');
  // Turning reminders off is immediate and total: this app has exactly one
  // source of scheduled notifications, so cancelling everything is safe.
  if (!enabled) {
    await initNotifications();
    await _plugin.cancelAllPendingNotifications();
    await clearAllScheduledNotificationIds();
  }
}

const _details = NotificationDetails(
  android: AndroidNotificationDetails(
    'anchor_reminders',
    'Anchor reminders',
    importance: Importance.defaultImportance,
  ),
  iOS: DarwinNotificationDetails(),
);

Future<void> _cancel(String type, String id) async {
  await initNotifications();
  await _plugin.cancel(id: _notificationId(type, id));
  await clearScheduledNotificationId(type, id);
}

/// Schedules [when] (must be in the future) and records the id mapping.
Future<void> _schedule(String type, String id, DateTime when, String title, String body) async {
  if (!when.isAfter(DateTime.now())) return;
  if (!await areRemindersEnabled()) return;
  if (!await ensureNotificationPermission()) return;

  final nid = _notificationId(type, id);
  await _plugin.zonedSchedule(
    id: nid,
    title: title,
    body: body,
    scheduledDate: tz.TZDateTime.from(when, tz.local),
    notificationDetails: _details,
    androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
  );
  await setScheduledNotificationId(type, id, nid);
}

// --- tasks ---------------------------------------------------------------

Future<void> cancelTaskReminder(String taskId) => _cancel('task', taskId);

Future<void> scheduleTaskReminder(Task task) async {
  await cancelTaskReminder(task.id);
  if (!task.isPending || task.dueDate == null) return;
  await _schedule('task', task.id, dueDateTime(task.dueDate!, task.dueTime, _defaultTaskReminderTime),
      task.title, task.dueTime != null ? 'Due now' : 'Due today');
}

// --- events --------------------------------------------------------------

Future<void> cancelEventReminder(String eventId) => _cancel('event', eventId);

Future<void> scheduleEventReminder(CalendarEvent event) async {
  await cancelEventReminder(event.id);
  // All-day events have no meaningful "15 minutes before" moment.
  if (event.allDay) return;
  await _schedule('event', event.id, event.startAt.subtract(const Duration(minutes: _eventLeadMinutes)),
      event.title, 'Starting at ${formatTime(event.startAt)}');
}

// --- documents -----------------------------------------------------------

Future<void> cancelDocumentReminder(String documentId) => _cancel('document', documentId);

Future<void> scheduleDocumentReminder(AnchorDocument doc) async {
  await cancelDocumentReminder(doc.id);
  if (doc.expirationDate == null) return;
  final when = dueDateTime(doc.expirationDate!, _morningReminderTime).subtract(const Duration(days: _documentLeadDays));
  await _schedule('document', doc.id, when, doc.name, 'Expires in $_documentLeadDays days');
}

// --- bills ---------------------------------------------------------------

Future<void> cancelBillReminder(String billId) => _cancel('bill', billId);

Future<void> scheduleBillReminder(Bill bill) async {
  await cancelBillReminder(bill.id);
  if (!bill.isUnpaid) return;
  await _schedule('bill', bill.id, dueDateTime(bill.dueDate, _morningReminderTime), bill.name,
      '${formatMoney(bill.amount, bill.currency)} due today');
}
