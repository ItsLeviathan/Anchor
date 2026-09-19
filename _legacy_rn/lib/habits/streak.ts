import type { Habit } from '../../types';

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const start = toDateOnly(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function isCompletedToday(habit: Pick<Habit, 'completedDates'>, now: Date = new Date()): boolean {
  return habit.completedDates.includes(toDateKey(now));
}

/**
 * Current streak length. Daily habits: consecutive days ending today or
 * yesterday - a streak isn't "broken" just because today hasn't happened
 * yet (it's still today). Weekly habits: consecutive calendar weeks
 * (Sun–Sat) with at least one completion, same not-broken-yet logic for
 * the current week.
 */
export function computeStreak(habit: Pick<Habit, 'frequency' | 'completedDates'>, now: Date = new Date()): number {
  const completed = new Set(habit.completedDates);
  if (completed.size === 0) return 0;

  if (habit.frequency === 'daily') {
    let streak = 0;
    const cursor = toDateOnly(now);

    if (!completed.has(toDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (completed.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  function weekHasCompletion(weekStart: Date): boolean {
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      if (completed.has(toDateKey(day))) return true;
    }
    return false;
  }

  let streak = 0;
  const weekCursor = startOfWeek(now);

  if (!weekHasCompletion(weekCursor)) {
    weekCursor.setDate(weekCursor.getDate() - 7);
  }

  while (weekHasCompletion(weekCursor)) {
    streak += 1;
    weekCursor.setDate(weekCursor.getDate() - 7);
  }

  return streak;
}

/** Whether a habit is "due" today, for surfacing on Today's habit list. */
export function isDueToday(habit: Pick<Habit, 'frequency' | 'daysOfWeek'>, now: Date = new Date()): boolean {
  if (habit.frequency === 'daily') return true;
  if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) return true;
  return habit.daysOfWeek.includes(now.getDay());
}
