import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { setLocalSetting } from '../database/db';
import { useSyncStore } from '../../store/useSyncStore';
import { refreshPendingCount, syncOnAppStart, syncOnReconnect, triggerFlush } from './engine';

const CURRENT_USER_ID_KEY = 'current_user_id';

// A backed-off queue entry (exponential retry after a failed attempt) only
// gets re-driven by one of the three triggers below - if the app just stays
// open, online, with no background/foreground or connectivity transition,
// nothing else calls triggerFlush(). This periodic check is the safety net
// for that case; listPending() already only returns entries whose backoff
// has elapsed, so calling triggerFlush() here is always safe to no-op.
const SYNC_RETRY_INTERVAL_MS = 90_000;

/**
 * Three triggers cover the realistic scenarios from spec section 38's
 * sync diagram: app start (initial pull + flush), connectivity actually
 * being restored (flush-then-pull), and returning to the foreground while
 * already online (a lightweight flush safety net - catches anything that
 * failed silently while backgrounded). A periodic timer on top of those
 * three covers the case where none of them fire for a long stretch.
 */
export function useSyncLifecycle(userId: string | undefined): void {
  const hasRunInitialSync = useRef(false);
  const wasOnline = useRef(true);

  useEffect(() => {
    refreshPendingCount().catch((err) => console.error('Failed to read pending sync count', err));

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      useSyncStore.getState().setOnline(online);

      if (online && !wasOnline.current && userId) {
        syncOnReconnect(userId).catch((err) => console.error('Reconnect sync failed', err));
      }
      wasOnline.current = online;
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && useSyncStore.getState().isOnline) {
        triggerFlush();
      }
    });

    const retryInterval = setInterval(() => {
      if (useSyncStore.getState().isOnline) triggerFlush();
    }, SYNC_RETRY_INTERVAL_MS);

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
      clearInterval(retryInterval);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || hasRunInitialSync.current) return;
    hasRunInitialSync.current = true;

    setLocalSetting(CURRENT_USER_ID_KEY, userId).catch((err) =>
      console.error('Failed to persist current user id for widgets', err)
    );

    syncOnAppStart(userId).catch((err) => console.error('Initial sync failed', err));
  }, [userId]);
}
