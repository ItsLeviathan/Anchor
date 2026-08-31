import { computeStreak } from '../habits/streak';
import type { Habit } from '../../types';

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fraction (0–1) of "due" days in the trailing window that were actually completed. */
export function computeHabitConsistency(habit: Habit, windowDays = 30, now: Date = new Date()): number {
  const completed = new Set(habit.completedDates);
  let dueCount = 0;
  let doneCount = 0;

  for (let i = 0; i < windowDays; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const isDue =
      habit.frequency === 'daily' || !habit.daysOfWeek || habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(date.getDay());

    if (!isDue) continue;
    dueCount += 1;
    if (completed.has(toDateKey(date))) doneCount += 1;
  }

  return dueCount > 0 ? doneCount / dueCount : 0;
}

export interface HabitInsight {
  habit: Habit;
  streak: number;
  consistency: number;
}

export function computeHabitInsights(habits: Habit[], now: Date = new Date()): HabitInsight[] {
  return habits.map((habit) => ({
    habit,
    streak: computeStreak(habit, now),
    consistency: computeHabitConsistency(habit, 30, now),
  }));
}
