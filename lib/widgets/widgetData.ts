import type { AnchorDocument, Bill, CalendarEvent, Task } from '../../types';
import { selectTodayTasks } from '../tasks/prioritization';

export interface TodayWidgetData {
  importantTaskTitle: string | null;
  nextEventLabel: string | null;
  countdownLabel: string | null;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * One widget covering both spec section 34 concepts (Today Widget +
 * Countdown Widget) rather than two separate ones - a deliberate scope
 * reduction for this first pass. Habit Widget and Quick Add Widget follow
 * the same pattern (own data function + own platform components) and are
 * natural next additions, not built yet.
 */
export function computeTodayWidgetData(
  tasks: Task[],
  events: CalendarEvent[],
  bills: Bill[],
  documents: AnchorDocument[],
  now: Date = new Date()
): TodayWidgetData {
  const importantTask = selectTodayTasks(tasks, 1, now)[0] ?? null;

  const upcomingEvents = events
    .filter((event) => new Date(event.startAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const nextEvent = upcomingEvents[0] ?? null;

  const nextEventLabel = nextEvent
    ? `${nextEvent.title} · ${new Date(nextEvent.startAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : null;

  // Nearest deadline across bills and document expirations. Tasks are
  // already surfaced via importantTaskTitle, so they're not duplicated here.
  const todayKey = toDatePart(now);
  const deadlineCandidates: { label: string; date: string }[] = [];

  for (const bill of bills) {
    if (bill.status === 'unpaid' && bill.dueDate >= todayKey) {
      deadlineCandidates.push({ label: bill.name, date: bill.dueDate });
    }
  }
  for (const document of documents) {
    if (document.expirationDate && document.expirationDate >= todayKey) {
      deadlineCandidates.push({ label: `${document.name} expires`, date: document.expirationDate });
    }
  }

  deadlineCandidates.sort((a, b) => a.date.localeCompare(b.date));
  const nearestDeadline = deadlineCandidates[0] ?? null;

  let countdownLabel: string | null = null;
  if (nearestDeadline) {
    const [year, month, day] = nearestDeadline.date.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayLabel = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
    countdownLabel = `${nearestDeadline.label} ${dayLabel}`;
  }

  return {
    importantTaskTitle: importantTask?.title ?? null,
    nextEventLabel,
    countdownLabel,
  };
}
