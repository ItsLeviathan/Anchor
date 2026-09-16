import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppLockStore } from '../../store/useAppLockStore';
import { authenticateWithBiometric, isAppLockEnabled } from './appLock';

// How long the app must be backgrounded before it re-locks (ms).
const LOCK_AFTER_BACKGROUND_MS = 15_000;

export function useAppLock() {
  const isLocked = useAppLockStore((s) => s.isLocked);
  const lockEnabled = useAppLockStore((s) => s.lockEnabled);
  const isAuthenticating = useAppLockStore((s) => s.isAuthenticating);
  const lastError = useAppLockStore((s) => s.lastError);
  const backgroundedAt = useRef<number | null>(null);

  // On mount: read the persisted lock preference and lock immediately if set.
  //
  // Deliberately fail closed here: whether the device currently reports
  // biometrics as available is irrelevant to whether the screen should show.
  // Gating on `isBiometricAvailable()` (as this used to) meant that if
  // biometric enrollment was ever removed at the OS level, or that check
  // threw/returned false for any reason, the lock silently never appeared
  // and the app opened straight to user data. Now, if the user has enabled
  // app lock, the lock screen always shows; `authenticateWithBiometric`
  // (which itself fails closed) is what decides whether it goes away.
  useEffect(() => {
    isAppLockEnabled().then((enabled) => {
      useAppLockStore.getState().setLockEnabled(enabled);
      if (enabled) useAppLockStore.getState().setIsLocked(true);
    });
  }, []);

  // Re-lock after returning from background if the app was away long enough.
  // Reads lockEnabled fresh from the store rather than closing over the
  // hook's own value, so this only needs to subscribe once — it still sees
  // up-to-date toggles made from any other useAppLock() instance (e.g. the
  // Profile screen).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active') {
        const t = backgroundedAt.current;
        if (t !== null && useAppLockStore.getState().lockEnabled && Date.now() - t > LOCK_AFTER_BACKGROUND_MS) {
          useAppLockStore.getState().setIsLocked(true);
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const unlock = useCallback(async () => {
    const store = useAppLockStore.getState();
    if (store.isAuthenticating) return;
    store.setIsAuthenticating(true);
    store.setLastError(null);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        store.setIsLocked(false);
      } else {
        store.setLastError('Authentication failed. Try again.');
      }
    } catch (err) {
      // authenticateWithBiometric already fails closed and shouldn't throw,
      // but guard here too so an unexpected error can never leave the app
      // unlocked, and so it's surfaced instead of swallowed.
      console.error('App lock unlock attempt failed', err);
      store.setLastError('Something went wrong. Try again.');
    } finally {
      store.setIsAuthenticating(false);
    }
  }, []);

  // Updates the shared in-memory setting immediately (so every useAppLock()
  // consumer — notably the enforcement gate in app/_layout.tsx — reacts
  // right away) independent of persisting it to SecureStore, which the
  // caller does separately.
  const setLockEnabled = useCallback((enabled: boolean) => {
    useAppLockStore.getState().setLockEnabled(enabled);
    if (!enabled) useAppLockStore.getState().setIsLocked(false);
  }, []);

  return { isLocked, lockEnabled, unlock, isAuthenticating, lastError, setLockEnabled };
}
