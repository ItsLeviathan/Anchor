import { isDueToday } from '../habits/streak';
import { selectTodayTasks } from '../tasks/prioritization';
import type { CalendarEvent, Habit, Task } from '../../types';

export interface DailyPlanResult {
  summary: string;
  focusTaskId: string | null;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Rule-based replacement for the old LLM-generated daily plan: same inputs
 * (today's tasks/events/habits), a templated sentence instead of
 * model-written prose, and the same focus-task selection the Today screen
 * already uses (lib/tasks/prioritization.ts).
 */
export function computeDailyPlan(
  tasks: Task[],
  events: CalendarEvent[],
  habits: Habit[],
  now: Date = new Date()
): DailyPlanResult {
  const todayKey = toDatePart(now);

  const pendingTasksToday = tasks.filter((task) => task.status === 'pending' && task.dueDate === todayKey);
  const eventsToday = events.filter((event) => toDatePart(new Date(event.startAt)) === todayKey);
  const habitsDueToday = habits.filter((habit) => isDueToday(habit, now) && !habit.completedDates.includes(todayKey));

  if (pendingTasksToday.length === 0 && eventsToday.length === 0 && habitsDueToday.length === 0) {
    return {
      summary: "Nothing on the calendar or due today - a good day to get ahead on something.",
      focusTaskId: null,
    };
  }

  const focusTask = selectTodayTasks(pendingTasksToday, 1, now)[0] ?? null;

  const extras: string[] = [];
  if (eventsToday.length > 0) extras.push(`${eventsToday.length} event${eventsToday.length === 1 ? '' : 's'}`);
  if (habitsDueToday.length > 0) {
    extras.push(`${habitsDueToday.length} habit${habitsDueToday.length === 1 ? '' : 's'} to check off`);
  }

  let summary: string;
  if (focusTask) {
    summary = extras.length > 0
      ? `Focus on "${focusTask.title}" first - you also have ${extras.join(' and ')} today.`
      : `Focus on "${focusTask.title}" first - nothing else urgent today.`;
  } else {
    summary = `Today you have ${extras.join(' and ')}.`;
  }

  return { summary, focusTaskId: focusTask?.id ?? null };
}
