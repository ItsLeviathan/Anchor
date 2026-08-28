import { supabase } from '../../lib/supabase/client';
import type { CalendarEvent, RecurrenceRule } from '../../types';

interface EventRow {
  id: string;
  user_id: string;
  calendar_id: string;
  title: string;
  location: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  recurrence_rule: RecurrenceRule | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    calendarId: row.calendar_id,
    title: row.title,
    location: row.location,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    recurrenceRule: row.recurrence_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches all events for the signed-in user. Personal calendars stay small
 * enough that fetching everything and filtering client-side (same approach
 * as tasks) is simpler than a paginated range query — worth revisiting if
 * someone accumulates years of events.
 */
export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('start_at', { ascending: true });

  if (error) throw error;
  return (data as EventRow[]).map(mapRow);
}

export interface CreateEventInput {
  userId: string;
  calendarId: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string | null;
}

export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: input.userId,
      calendar_id: input.calendarId,
      title: input.title.trim(),
      start_at: input.startAt,
      end_at: input.endAt,
      all_day: input.allDay ?? false,
      location: input.location ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
