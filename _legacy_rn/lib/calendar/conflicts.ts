export interface Interval {
  start: Date;
  end: Date;
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/**
 * Returns every existing event that overlaps the candidate interval,
 * excluding the event's own id when editing (so it doesn't "conflict" with
 * itself).
 */
export function findOverlappingEvents<T extends Interval & { id: string }>(
  candidate: Interval,
  existing: T[],
  excludeId?: string
): T[] {
  return existing.filter((event) => event.id !== excludeId && intervalsOverlap(candidate, event));
}
