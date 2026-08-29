import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSyncStore } from '../../store/useSyncStore';
import { refreshPendingCount, syncOnAppStart, syncOnReconnect, triggerFlush } from './engine';

/**
 * Three triggers cover the realistic scenarios from spec section 38's
 * sync diagram: app start (initial pull + flush), connectivity actually
 * being restored (flush-then-pull), and returning to the foreground while
 * already online (a lightweight flush safety net - catches anything that
 * failed silently while backgrounded).
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

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || hasRunInitialSync.current) return;
    hasRunInitialSync.current = true;
    syncOnAppStart(userId).catch((err) => console.error('Initial sync failed', err));
  }, [userId]);
}
