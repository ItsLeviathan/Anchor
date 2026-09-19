import type { CalendarEvent, Task } from '../../types';

export interface DayWorkload {
  /** 'YYYY-MM-DD' */
  date: string;
  taskCount: number;
  eventCount: number;
  estimatedMinutes: number;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeWorkloadByDay(
  tasks: Task[],
  events: CalendarEvent[],
  days = 7,
  now: Date = new Date()
): DayWorkload[] {
  const result: DayWorkload[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = toDatePart(date);

    const dayTasks = tasks.filter((task) => task.status === 'pending' && task.dueDate === key);
    const dayEvents = events.filter((event) => toDatePart(new Date(event.startAt)) === key);

    result.push({
      date: key,
      taskCount: dayTasks.length,
      eventCount: dayEvents.length,
      estimatedMinutes: dayTasks.reduce((sum, task) => sum + (task.estimatedDurationMinutes ?? 0), 0),
    });
  }

  return result;
}

export interface CategoryDistributionEntry {
  categoryId: string | null;
  count: number;
}

export function computeCategoryDistribution(tasks: Task[]): CategoryDistributionEntry[] {
  const counts = new Map<string | null, number>();

  for (const task of tasks) {
    if (task.status === 'cancelled') continue;
    counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count);
}
