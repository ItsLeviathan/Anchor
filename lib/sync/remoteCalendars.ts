import type { CalendarRow } from '../database/localCalendars';
import { supabase } from '../supabase/client';

export async function fetchRemoteCalendars(): Promise<CalendarRow[]> {
  const { data, error } = await supabase.from('calendars').select('*').order('is_default', { ascending: false });
  if (error) throw error;
  return data as CalendarRow[];
}
