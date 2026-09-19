import type { CalendarEvent, Task } from '../../types';

export interface FreeSlot {
  start: Date;
  end: Date;
  minutes: number;
}

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;

/** Free gaps in today's schedule between now and 9pm, respecting an 8am–9pm day. */
export function findFreeSlotsToday(events: CalendarEvent[], now: Date = new Date()): FreeSlot[] {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_START_HOUR, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_END_HOUR, 0, 0);
  const windowStart = now.getTime() > dayStart.getTime() ? now : dayStart;

  if (windowStart.getTime() >= dayEnd.getTime()) return [];

  const todaysEvents = events
    .filter((event) => !event.allDay)
    .map((event) => ({ start: new Date(event.startAt), end: new Date(event.endAt) }))
    .filter((event) => event.end.getTime() > windowStart.getTime() && event.start.getTime() < dayEnd.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: FreeSlot[] = [];
  let cursor = windowStart;

  for (const event of todaysEvents) {
    if (event.start.getTime() > cursor.getTime()) {
      const minutes = Math.round((event.start.getTime() - cursor.getTime()) / (1000 * 60));
      if (minutes > 0) slots.push({ start: cursor, end: event.start, minutes });
    }
    if (event.end.getTime() > cursor.getTime()) cursor = event.end;
  }

  if (cursor.getTime() < dayEnd.getTime()) {
    const minutes = Math.round((dayEnd.getTime() - cursor.getTime()) / (1000 * 60));
    if (minutes > 0) slots.push({ start: cursor, end: dayEnd, minutes });
  }

  return slots;
}

export interface FreeTimeSuggestion {
  slot: FreeSlot;
  task: Task;
}

/**
 * Picks the largest free slot today (30+ minutes) and the best-fitting
 * pending task with an estimated duration that fits inside it. Returns
 * null if there's no meaningful gap or nothing that fits - this is meant
 * to appear rarely and only when it's actually useful, not as a
 * permanent fixture on Today.
 */
export function suggestTaskForFreeTime(
  tasks: Task[],
  events: CalendarEvent[],
  now: Date = new Date()
): FreeTimeSuggestion | null {
  const slots = findFreeSlotsToday(events, now).filter((slot) => slot.minutes >= 30);
  if (slots.length === 0) return null;

  const largest = slots.reduce((best, slot) => (slot.minutes > best.minutes ? slot : best), slots[0]);

  const candidates = tasks
    .filter(
      (task) =>
        task.status === 'pending' &&
        typeof task.estimatedDurationMinutes === 'number' &&
        task.estimatedDurationMinutes > 0 &&
        task.estimatedDurationMinutes <= largest.minutes
    )
    .sort((a, b) => (b.estimatedDurationMinutes ?? 0) - (a.estimatedDurationMinutes ?? 0));

  if (candidates.length === 0) return null;

  return { slot: largest, task: candidates[0] };
}
