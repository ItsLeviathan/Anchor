export type QuickAddType = 'task' | 'event' | 'bill';

export interface QuickAddResult {
  type: QuickAddType;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  amount: number | null;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "Next Friday" said on a Wednesday means the coming Friday (the common everyday convention) - "next" only pushes a week out when today already *is* that weekday. */
function resolveWeekday(from: Date, targetDow: number, isNext: boolean): Date {
  const result = new Date(from);
  const currentDow = from.getDay();
  let diff = (targetDow - currentDow + 7) % 7;
  if (diff === 0) diff = isNext ? 7 : 0;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Parses free text into a suggested creation type and fields, entirely
 * offline and without AI - per spec section 20, basic patterns must work
 * even when AI is unavailable or disabled. AI-assisted parsing (Brain
 * Dump) handles everything this can't.
 */
export function parseQuickAdd(rawText: string, now: Date = new Date()): QuickAddResult {
  let text = rawText.trim();
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let amount: number | null = null;

  // --- amount (a currency-shaped number signals a bill) ---
  const amountMatch =
    text.match(/[₱$€£]\s?([\d,]+(?:\.\d{1,2})?)/) ?? text.match(/\b([\d,]+(?:\.\d{1,2})?)\s?(?:pesos|dollars|php|usd)\b/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    text = text.replace(amountMatch[0], ' ').trim();
  }

  // --- time of day (e.g. "3 PM", "3:30pm") ---
  const timeMatch = text.match(/\b(\d{1,2})(:(\d{2}))?\s?(am|pm)\b/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const meridiem = timeMatch[4].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    dueTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    text = text.replace(timeMatch[0], ' ').replace(/\bat\b/i, ' ').trim();
  }

  // --- relative / named dates ---
  // Matched directly against `text` (not a lowercased copy) with the `i`
  // flag, so the matched substring keeps its original casing and can be
  // removed from `text` with a plain, case-correct replace.
  if (/\btoday\b/i.test(text)) {
    dueDate = toDatePart(now);
    text = text.replace(/\btoday\b/i, ' ').trim();
  } else if (/\btomorrow\b/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    dueDate = toDatePart(d);
    text = text.replace(/\btomorrow\b/i, ' ').trim();
  } else {
    const weekdayMatch = text.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (weekdayMatch) {
      const isNext = Boolean(weekdayMatch[1]);
      const dow = WEEKDAYS.indexOf(weekdayMatch[2].toLowerCase());
      dueDate = toDatePart(resolveWeekday(now, dow, isNext));
      text = text.replace(weekdayMatch[0], ' ').trim();
    } else {
      const inDaysMatch = text.match(/\bin\s+(\d+)\s+days?\b/i);
      const inWeeksMatch = text.match(/\bin\s+(\d+)\s+weeks?\b/i);
      if (inDaysMatch) {
        const d = new Date(now);
        d.setDate(d.getDate() + parseInt(inDaysMatch[1], 10));
        dueDate = toDatePart(d);
        text = text.replace(inDaysMatch[0], ' ').trim();
      } else if (inWeeksMatch) {
        const d = new Date(now);
        d.setDate(d.getDate() + parseInt(inWeeksMatch[1], 10) * 7);
        dueDate = toDatePart(d);
        text = text.replace(inWeeksMatch[0], ' ').trim();
      } else if (/\bnext week\b/i.test(text)) {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        dueDate = toDatePart(d);
        text = text.replace(/\bnext week\b/i, ' ').trim();
      } else if (/\bnext month\b/i.test(text)) {
        dueDate = toDatePart(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
        text = text.replace(/\bnext month\b/i, ' ').trim();
      }
    }
  }

  // --- tidy up connector words left behind by the removals above ---
  text = text
    .replace(/\bdue\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  let type: QuickAddType = 'task';
  if (amount !== null) type = 'bill';
  else if (dueTime !== null) type = 'event';

  return {
    type,
    title: text || rawText.trim(),
    dueDate,
    dueTime,
    amount,
  };
}
