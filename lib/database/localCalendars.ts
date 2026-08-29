import { getDb } from './db';

export interface CalendarRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
}

interface RawRow extends Omit<CalendarRow, 'is_default'> {
  is_default: number;
}

function fromRaw(row: RawRow): CalendarRow {
  return { ...row, is_default: row.is_default === 1 };
}

export async function getLocalCalendars(userId: string): Promise<CalendarRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_calendars WHERE user_id = ? ORDER BY is_default DESC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function replaceLocalCalendars(userId: string, calendars: CalendarRow[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM local_calendars WHERE user_id = ?;`, [userId]);
    for (const calendar of calendars) {
      await db.runAsync(`INSERT INTO local_calendars (id, user_id, name, color, is_default) VALUES (?, ?, ?, ?, ?);`, [
        calendar.id,
        calendar.user_id,
        calendar.name,
        calendar.color,
        calendar.is_default ? 1 : 0,
      ]);
    }
  });
}
