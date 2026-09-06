import { mapBillRow } from '../../features/bills/api';
import { mapEventRow } from '../../features/events/api';
import { mapTaskRow } from '../../features/tasks/api';
import { getLocalBills } from '../database/localBills';
import { getLocalEvents } from '../database/localEvents';
import { getLocalTasks } from '../database/localTasks';
import { computeTodayWidgetData, type TodayWidgetData } from './widgetData';

/**
 * Documents are intentionally excluded here - they're online-only (see
 * Phase 5's migration 0006 comment) with no local cache, so they can't be
 * read from a background task without a network round trip. The
 * countdown reflects bills reliably; document-expiration countdowns only
 * appear after the app itself has refreshed the widget while online.
 */
export async function getLocalWidgetSnapshot(userId: string): Promise<TodayWidgetData> {
  const [taskRows, eventRows, billRows] = await Promise.all([
    getLocalTasks(userId),
    getLocalEvents(userId),
    getLocalBills(userId),
  ]);

  return computeTodayWidgetData(taskRows.map(mapTaskRow), eventRows.map(mapEventRow), billRows.map(mapBillRow), []);
}
