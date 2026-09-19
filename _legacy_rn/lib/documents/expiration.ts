export type ExpirationStatus = 'expired' | 'soon' | 'ok' | 'none';

const SOON_THRESHOLD_DAYS = 30;

/** Whole days from now until the given date (negative if already past). */
export function daysUntil(dateStr: string, now: Date = new Date()): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpirationStatus(expirationDate: string | null, now: Date = new Date()): ExpirationStatus {
  if (!expirationDate) return 'none';
  const days = daysUntil(expirationDate, now);
  if (days < 0) return 'expired';
  if (days <= SOON_THRESHOLD_DAYS) return 'soon';
  return 'ok';
}

/** Matches spec section 25's own example phrasing: "Driver's license expires in 14 days." */
export function formatExpirationLabel(expirationDate: string | null, now: Date = new Date()): string | null {
  if (!expirationDate) return null;
  const days = daysUntil(expirationDate, now);

  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
  if (days === 0) return 'Expires today';
  return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
}
