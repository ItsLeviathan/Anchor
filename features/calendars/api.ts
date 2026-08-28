import { supabase } from '../../lib/supabase/client';
import type { Calendar } from '../../types';

interface CalendarRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
}

function mapRow(row: CalendarRow): Calendar {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    isDefault: row.is_default,
  };
}

export async function fetchCalendars(): Promise<Calendar[]> {
  const { data, error } = await supabase
    .from('calendars')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) throw error;
  return (data as CalendarRow[]).map(mapRow);
}
