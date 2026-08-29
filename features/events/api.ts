import { getLocalEvents, upsertLocalEvent, type EventRow } from '../../lib/database/localEvents';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { CalendarEvent, RecurrenceRule } from '../../types';

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
    recurrenceRule: (row.recurrence_rule as unknown as RecurrenceRule | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchEvents(userId: string): Promise<CalendarEvent[]> {
  const rows = await getLocalEvents(userId);
  return rows.map(mapRow);
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
  const now = new Date().toISOString();
  const row: EventRow = {
    id: generateId(),
    user_id: input.userId,
    calendar_id: input.calendarId,
    title: input.title.trim(),
    location: input.location ?? null,
    description: null,
    start_at: input.startAt,
    end_at: input.endAt,
    all_day: input.allDay ?? false,
    recurrence_rule: null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalEvent(row);
  await enqueueUpsert('event', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteEvent(id: string): Promise<void> {
  await enqueueDelete('event', id);
}
