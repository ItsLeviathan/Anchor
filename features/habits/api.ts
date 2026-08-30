import { getLocalHabits, upsertLocalHabit, type HabitRow } from '../../lib/database/localHabits';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Habit, HabitFrequency } from '../../types';

function mapRow(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    frequency: row.frequency as HabitFrequency,
    daysOfWeek: row.days_of_week,
    completedDates: row.completed_dates,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const rows = await getLocalHabits(userId);
  return rows.map(mapRow);
}

export interface CreateHabitInput {
  userId: string;
  name: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[] | null;
  categoryId?: string | null;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const now = new Date().toISOString();
  const row: HabitRow = {
    id: generateId(),
    user_id: input.userId,
    category_id: input.categoryId ?? null,
    name: input.name.trim(),
    frequency: input.frequency,
    days_of_week: input.daysOfWeek ?? null,
    completed_dates: [],
    archived: false,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalHabit(row);
  await enqueueUpsert('habit', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

/** Toggles today's completion. No shaming for a broken streak - the UI just reflects the state, per spec section 27. */
export async function toggleHabitToday(habit: Habit, now: Date = new Date()): Promise<Habit> {
  const key = toDateKey(now);
  const isCompleted = habit.completedDates.includes(key);
  const nextDates = isCompleted
    ? habit.completedDates.filter((date) => date !== key)
    : [...habit.completedDates, key];

  const row: HabitRow = {
    id: habit.id,
    user_id: habit.userId,
    category_id: habit.categoryId,
    name: habit.name,
    frequency: habit.frequency,
    days_of_week: habit.daysOfWeek,
    completed_dates: nextDates,
    archived: habit.archived,
    created_at: habit.createdAt,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalHabit(row);
  await enqueueUpsert('habit', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteHabit(id: string): Promise<void> {
  await enqueueDelete('habit', id);
}
