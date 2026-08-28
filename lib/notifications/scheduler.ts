import * as Notifications from 'expo-notifications';

import {
  clearScheduledNotificationId,
  getScheduledNotificationId,
  setScheduledNotificationId,
} from '../database/db';
import type { CalendarEvent, Task } from '../../types';
import { areRemindersEnabled } from './preferences';
import { ensureNotificationSetup } from './setup';

const EVENT_REMINDER_LEAD_MINUTES = 15;
/** Date-only tasks (no due time) get a single morning reminder. */
const DEFAULT_TASK_REMINDER_TIME = '09:00';

function computeTaskTriggerDate(task: Pick<Task, 'dueDate' | 'dueTime'>): Date | null {
  if (!task.dueDate) return null;
  return new Date(`${task.dueDate}T${task.dueTime ?? DEFAULT_TASK_REMINDER_TIME}`);
}

export async function scheduleTaskReminder(task: Task): Promise<void> {
  await cancelTaskReminder(task.id);

  if (task.status !== 'pending') return;
  if (!(await areRemindersEnabled())) return;

  const triggerDate = computeTaskTriggerDate(task);
  if (!triggerDate || triggerDate.getTime() <= Date.now()) return;

  const permitted = await ensureNotificationSetup();
  if (!permitted) return;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: task.dueTime ? 'Due now' : 'Due today',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });

  await setScheduledNotificationId('task', task.id, notificationId);
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  const notificationId = await getScheduledNotificationId('task', taskId);
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await clearScheduledNotificationId('task', taskId);
}

export async function scheduleEventReminder(event: CalendarEvent): Promise<void> {
  await cancelEventReminder(event.id);

  // All-day events don't have a meaningful "15 minutes before" moment.
  if (event.allDay) return;
  if (!(await areRemindersEnabled())) return;

  const startAt = new Date(event.startAt);
  const triggerDate = new Date(startAt.getTime() - EVENT_REMINDER_LEAD_MINUTES * 60 * 1000);
  if (triggerDate.getTime() <= Date.now()) return;

  const permitted = await ensureNotificationSetup();
  if (!permitted) return;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: event.title,
      body: `Starting at ${startAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });

  await setScheduledNotificationId('event', event.id, notificationId);
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const notificationId = await getScheduledNotificationId('event', eventId);
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await clearScheduledNotificationId('event', eventId);
}
