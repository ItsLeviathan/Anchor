import type { CalendarEvent, Task } from '../../types';
import { isSameDay } from './monthGrid';

export type AgendaItem =
  | { type: 'event'; id: string; sortTime: number; event: CalendarEvent }
  | { type: 'task'; id: string; sortTime: number; task: Task };

export function tasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const [year, month, day] = task.dueDate.split('-').map(Number);
    return isSameDay(new Date(year, month - 1, day), date);
  });
}

export function eventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return events.filter((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return start.getTime() < dayEnd.getTime() && end.getTime() > dayStart.getTime();
  });
}

export function buildAgenda(tasks: Task[], events: CalendarEvent[], date: Date): AgendaItem[] {
  const items: AgendaItem[] = [
    ...eventsForDate(events, date).map((event) => ({
      type: 'event' as const,
      id: `event-${event.id}`,
      sortTime: new Date(event.startAt).getTime(),
      event,
    })),
    ...tasksForDate(tasks, date).map((task) => ({
      type: 'task' as const,
      id: `task-${task.id}`,
      sortTime: task.dueTime
        ? new Date(`${task.dueDate}T${task.dueTime}`).getTime()
        : new Date(`${task.dueDate}T00:00`).getTime(),
      task,
    })),
  ];

  return items.sort((a, b) => a.sortTime - b.sortTime);
}
