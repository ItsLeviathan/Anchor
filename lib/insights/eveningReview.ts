import type { Habit, Task } from '../../types';

export interface EveningReview {
  tasksCompletedToday: number;
  habitsCompletedToday: number;
  /** Tasks due today or earlier that are still pending - the closest honest proxy to "moved to tomorrow" without a reschedule event log. */
  stillPendingCount: number;
  tomorrowCount: number;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeEveningReview(tasks: Task[], habits: Habit[], now: Date = new Date()): EveningReview {
  const todayKey = toDatePart(now);

  const tasksCompletedToday = tasks.filter(
    (task) => task.status === 'completed' && task.completedAt && toDatePart(new Date(task.completedAt)) === todayKey
  ).length;

  const habitsCompletedToday = habits.filter((habit) => habit.completedDates.includes(todayKey)).length;

  const stillPendingCount = tasks.filter(
    (task) => task.status === 'pending' && task.dueDate !== null && task.dueDate <= todayKey
  ).length;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDatePart(tomorrow);
  const tomorrowCount = tasks.filter((task) => task.status === 'pending' && task.dueDate === tomorrowKey).length;

  return { tasksCompletedToday, habitsCompletedToday, stillPendingCount, tomorrowCount };
}
