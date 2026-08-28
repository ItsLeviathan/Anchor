import { getLocalSetting, setLocalSetting } from '../database/db';

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
}
