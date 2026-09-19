import type { Task, TaskPriority, TaskStatus } from '../../types';

/**
 * Deterministic task prioritization (spec section 14).
 *
 * This intentionally does not call any AI — it combines deadline urgency,
 * declared priority, and overdue status into a single score. Dependency
 * impact and calendar-availability weighting are noted here as future
 * inputs once tasks can depend on each other and events exist (Phase 2
 * Calendar slice), but nothing below assumes they exist yet.
 */

export interface TaskForScoring {
  dueDate: string | null;
  dueTime: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

function toDueDateTime(dueDate: string, dueTime: string | null): Date {
  return new Date(`${dueDate}T${dueTime ?? '23:59'}`);
}

export function isOverdue(
  task: Pick<TaskForScoring, 'dueDate' | 'dueTime' | 'status'>,
  now: Date = new Date()
): boolean {
  if (!task.dueDate || task.status !== 'pending') return false;
  return toDueDateTime(task.dueDate, task.dueTime).getTime() < now.getTime();
}

export function computeTaskScore(task: TaskForScoring, now: Date = new Date()): number {
  if (task.status !== 'pending') return -Infinity;

  let score = PRIORITY_WEIGHT[task.priority] * 10;

  if (task.dueDate) {
    const due = toDueDateTime(task.dueDate, task.dueTime);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) {
      // Overdue tasks rank above everything else. The score still grows
      // with how overdue it is, but is capped so a months-old task doesn't
      // permanently bury everything else forever.
      const overdueDays = Math.min(-hoursUntilDue / 24, 14);
      score += 50 + overdueDays;
    } else if (hoursUntilDue <= 24) {
      score += 30 - hoursUntilDue / 24; // ramps up as the due hour approaches
    } else if (hoursUntilDue <= 24 * 7) {
      score += 10;
    }
  }

  return score;
}

export function sortTasksByPriority<T extends TaskForScoring>(tasks: T[], now: Date = new Date()): T[] {
  return [...tasks]
    .filter((task) => task.status === 'pending')
    .sort((a, b) => computeTaskScore(b, now) - computeTaskScore(a, now));
}

/** Tasks worth surfacing on the Today screen: capped, most important first. */
export function selectTodayTasks(tasks: Task[], limit = 5, now: Date = new Date()): Task[] {
  return sortTasksByPriority(tasks, now).slice(0, limit);
}
