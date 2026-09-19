import * as Notifications from 'expo-notifications';

import { clearAllScheduledNotificationIds, getLocalSetting, setLocalSetting } from '../database/db';

const REMINDERS_ENABLED_KEY = 'reminders_enabled';

/**
 * Reminder preferences are device-local rather than synced through
 * Supabase - there's no server-side reason to know this, and it avoids a
 * round trip on a setting the user expects to take effect instantly.
 */
export async function areRemindersEnabled(): Promise<boolean> {
  const value = await getLocalSetting(REMINDERS_ENABLED_KEY);
  return value !== 'false'; // enabled by default until explicitly turned off
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await setLocalSetting(REMINDERS_ENABLED_KEY, enabled ? 'true' : 'false');

  // Turning reminders off should be immediate and total: every future
  // schedule/reschedule already checks this flag, but anything scheduled
  // *before* the toggle flipped would otherwise keep firing at its
  // original time until the user happens to edit it. This app has exactly
  // one source of native scheduled notifications (lib/notifications/
  // scheduler.ts), so cancelling everything here is safe, not just "cancel
  // the ones we happen to be tracking".
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await clearAllScheduledNotificationIds();
  }
}
