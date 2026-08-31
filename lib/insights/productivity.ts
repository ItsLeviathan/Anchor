import type { Task } from '../../types';

export interface ProductivityStats {
  completedCount: number;
  totalCount: number;
  /** 0–1 */
  completionRate: number;
  overdueCount: number;
  /** Hours from creation to completion, averaged - null if nothing's been completed yet. */
  averageCompletionHours: number | null;
}

export function computeProductivityStats(tasks: Task[], now: Date = new Date()): ProductivityStats {
  const relevant = tasks.filter((task) => task.status !== 'cancelled');
  const completed = relevant.filter((task) => task.status === 'completed');
  const pending = relevant.filter((task) => task.status === 'pending');

  const overdueCount = pending.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(`${task.dueDate}T${task.dueTime ?? '23:59'}`);
    return due.getTime() < now.getTime();
  }).length;

  const completionHours = completed
    .filter((task): task is Task & { completedAt: string } => Boolean(task.completedAt))
    .map((task) => (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60));

  const averageCompletionHours =
    completionHours.length > 0 ? completionHours.reduce((sum, hours) => sum + hours, 0) / completionHours.length : null;

  return {
    completedCount: completed.length,
    totalCount: relevant.length,
    completionRate: relevant.length > 0 ? completed.length / relevant.length : 0,
    overdueCount,
    averageCompletionHours,
  };
}
