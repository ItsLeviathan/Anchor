import { getLocalCalendars } from '../../lib/database/localCalendars';
import type { CalendarRow } from '../../lib/database/localCalendars';
import type { Calendar } from '../../types';

function mapRow(row: CalendarRow): Calendar {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    isDefault: row.is_default,
  };
}

/** Same pattern as categories: served from the local cache the sync engine's pull step keeps fresh. */
export async function fetchCalendars(userId: string): Promise<Calendar[]> {
  const rows = await getLocalCalendars(userId);
  return rows.map(mapRow);
}
