import type { RecurrenceRule } from '../../types';

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setMonth(next.getMonth() + months);
  // Guard against month-end overflow: Jan 31 + 1 month should land on the
  // last day of February, not roll into March.
  if (next.getDate() !== originalDay) {
    next.setDate(0);
  }
  return next;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes the next due date for a recurring task from the date the current
 * instance was due. Anchor generates recurring instances one at a time (on
 * completion of the previous one) rather than pre-materializing a batch of
 * future rows, per spec section 18.
 */
export function computeNextDueDate(currentDueDate: string, rule: RecurrenceRule): string {
  const [year, month, day] = currentDueDate.split('-').map(Number);
  const current = new Date(year, month - 1, day);

  switch (rule.freq) {
    case 'daily':
      return toDatePart(addDays(current, rule.interval));

    case 'weekly': {
      if (rule.byweekday && rule.byweekday.length > 0) {
        const sortedDays = [...rule.byweekday].sort((a, b) => a - b);
        const currentDow = current.getDay();
        const nextDowThisWeek = sortedDays.find((dow) => dow > currentDow);

        if (nextDowThisWeek !== undefined) {
          return toDatePart(addDays(current, nextDowThisWeek - currentDow));
        }

        // No more configured weekdays this week - wrap to the first one,
        // `interval` weeks out.
        const daysToWrap = 7 * rule.interval - currentDow + sortedDays[0];
        return toDatePart(addDays(current, daysToWrap));
      }
      return toDatePart(addDays(current, 7 * rule.interval));
    }

    case 'monthly':
      return toDatePart(addMonths(current, rule.interval));

    case 'yearly':
      return toDatePart(addMonths(current, 12 * rule.interval));

    default:
      return toDatePart(addDays(current, 1));
  }
}
