import type { TaskStatus } from '../../types';

export function formatDueLabel(dueDate: string, dueTime: string | null, status: TaskStatus): string {
  const due = new Date(`${dueDate}T${dueTime ?? '23:59'}`);
  const now = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  let dateLabel: string;
  if (isSameDay(due, now)) {
    dateLabel = 'Today';
  } else if (isSameDay(due, tomorrow)) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const timeLabel = dueTime ? due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null;
  const isOverdue = status === 'pending' && due.getTime() < now.getTime();
  const prefix = isOverdue ? 'Overdue · ' : '';

  return timeLabel ? `${prefix}${dateLabel} · ${timeLabel}` : `${prefix}${dateLabel}`;
}
