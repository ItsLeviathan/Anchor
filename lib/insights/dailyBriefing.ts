import { isDueToday } from '../habits/streak';
import { selectTodayTasks } from '../tasks/prioritization';
import type { Bill, CalendarEvent, Habit, Task } from '../../types';

export interface DailyBriefing {
  importantTaskCount: number;
  appointmentCount: number;
  upcomingBillCount: number;
  habitCount: number;
  mostImportantTask: Task | null;
  estimatedWorkloadMinutes: number;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyBriefing(
  tasks: Task[],
  events: CalendarEvent[],
  bills: Bill[],
  habits: Habit[],
  now: Date = new Date()
): DailyBriefing {
  const todayKey = toDatePart(now);
  const importantTasks = selectTodayTasks(tasks, 10, now);
  const todaysEvents = events.filter((event) => toDatePart(new Date(event.startAt)) === todayKey);

  const billLookaheadEnd = toDatePart(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));
  const upcomingBills = bills.filter(
    (bill) => bill.status === 'unpaid' && bill.dueDate >= todayKey && bill.dueDate <= billLookaheadEnd
  );

  const dueHabits = habits.filter((habit) => isDueToday(habit, now));

  return {
    importantTaskCount: importantTasks.length,
    appointmentCount: todaysEvents.length,
    upcomingBillCount: upcomingBills.length,
    habitCount: dueHabits.length,
    mostImportantTask: importantTasks[0] ?? null,
    estimatedWorkloadMinutes: importantTasks.reduce((sum, task) => sum + (task.estimatedDurationMinutes ?? 0), 0),
  };
}

/** e.g. 135 -> "2h 15m" - matches spec section 32's own formatting exactly. */
export function formatWorkload(minutes: number): string {
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
